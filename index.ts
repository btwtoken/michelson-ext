import { readFileSync } from 'fs'
import { argv } from 'process'

type MethodMap = {[_ : string] : {args: string[], definition: string}}

const main = () => {
  if (argv.length < 3)
    return

  const file_path = argv[2]
  const tz_raw = readFileSync(file_path).toString().trim()
  const libs = tz_raw.slice(0, tz_raw.indexOf('parameter')).match(/@[\w\.]+/g)
  const libs_raw = libs ? libs.map(x => readFileSync(x.slice(1)).toString().trim()) : []

  const method_map = parse_libs(libs_raw)
  const result = apply_methods(tz_raw, method_map)
  console.log(result)
}

const apply_methods = (tz_raw : string, method_map : MethodMap) => {
  return tz_raw.replace(/@[\w\ ]+?[;\r\n]/g, _raw => {
    const raw = _raw.slice(1, -1).trim()
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
      method_map[identity] = {args, definition}
    })
  })

  return method_map
}

main()