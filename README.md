# michelson-ext
An extension for writing michelson

### Tips
1. `dup[ x : y : ... ]` means to duplicate the x-th, y-th element on the current stack.
2. <code>`</code> means a meaningless method.
3. `@` means a meaningful method. The number of `@` is only a mark for counting the number of return of the methods.
4. `@zzz[ x : y : ... ]` is just a shortcut for `dup[ x : y : ... ]; @zzz;`