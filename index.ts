import { readFileSync, writeFile } from 'fs'
import { argv } from 'process'

type MethodMap = {[_ : string] : {args: string[], definition: string}}

const main = () => {
  if (argv.length < 3)
    return

  const file_path = argv[2]
  const tz_raw = readFileSync(file_path).toString().trim()
  const parameter_index = tz_raw.indexOf('parameter')

  const libs = tz_raw.slice(0, parameter_index).match(/@[\w\.]+/g)
  const libs_raw = libs ? libs.map(x => readFileSync(x.slice(1)).toString().trim()) : []

  const tz_raw_content = tz_raw.slice(parameter_index)
  const method_map = parse_libs(libs_raw)
  const dup_expand_result = dup_expand(tz_raw_content)
  const method_result = apply_methods(dup_expand_result, method_map)
  
  const result = method_result

  const output_name = file_path.replace('.tzext', '.miext.tz')
  writeFile(output_name, result, (err) => {
    console.log(err || output_name + ' written')
  })
}

const dup_expand = (content : string) => {
  return content.replace(/(dup|@+?\w+)\[\s*?\d+?\s*?(:\s*?\d+?\s*?)*?\]/g, raw => {
    if (raw[0] === '@') {
      const reversed = raw.split('[').reverse()
      reversed[0] = dup_replace(reversed[0].slice(0, -1))
      return reversed.join('; ')
    } else 
      return dup_replace(raw.slice(4, -1))
  })
}
const dup_replace = (stack_str : string) => {
  const nums = stack_str.split(/:/g).map(x => parseInt(x.trim()))
  nums.reverse()

  const result : string[] = []
  nums.forEach((x, i) => {
    result.push('D' + 'U'.repeat(x + i + 1) + 'P')
  })

  return result.join(';')
}

const apply_methods = (tz_raw : string, method_map : MethodMap) => {
  return tz_raw.replace(/(@+?|`)[\w\ ]+?[};\r\n]/g, _raw => {
    const raw = _raw.slice(1, -1).replace(/^@+/g, '').trim()
    const [identity, ...args] = raw.split(/\s+/g)
    const method = method_map[identity]
    if (!method) return _raw

    const arg_map : {[_ : string] : string} = {}
    args.forEach((x, i) => arg_map[method.args[i]] = x)
    
    const rendered = method.args.length ? method.definition.replace(new RegExp(method.args.map(x => '@' + x + '\\b').join('|'), 'g'), _raw => {
      const raw = _raw.slice(1)
      return arg_map[raw] || _raw
    }) : method.definition

    return rendered + _raw.slice(-1)
  })
}

const parse_libs = (libs_raw : string[]) => {
  const method_map : MethodMap = {}
  libs_raw.forEach(raw => {
    raw.split(/;;/g).forEach(s => {
      s = s.trim()
      if (!s) return
      const [vars, definition] = s.split('=').map(x => x.trim())
      const [identity, ...args] = vars.split(/\ /g).map(x => x.trim())
      identity.split('|').forEach(id => {
        method_map[id.trim()] = {args, definition: definition.replace(/[\r\n]+/g, ' ')}
      })
    })
  })

  return method_map
}

main()