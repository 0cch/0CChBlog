---
author: admin
comments: true
layout: post
slug: '0cchext plugin update 1.0.19.1'
title: 0cchext插件更新 1.0.19.1
date: 2018-11-26 22:05:21
categories:
- Tips
---

最近把windbg插件0cchext升级到1.0.19.1，完善了autocmd命令，并且增加了accessmask，oledata和cppexcr命令。
### autocmd更新：  
> 现在支持全局自动运行命令，区分应用层调试和内核调试，并且区分了普通调试和DUMP分析，配置文件依然是插件同目录下的autocmd.ini。

```
[all]
? 88 * 66

[kernel]
!process 0 0 explorer.exe

[kernel dump]
!analyze -v

[notepad.exe]
.sympath+ c:\notepad_pdb
~*k

[calc.exe]
.sympath+ c:\calc_pdb
~*k

[calc.exe dump]
.excr
```
在[all]区间的命令，会在所有情况下执行；[kernel]区间的命令会在内核调试的情况下执行；[kernel dump]区间的命令会在内核调试dump的情况下执行；[app.exe]区间是在调试某exe的时候执行；最后[app.exe dump]命令会在调试指定exe的dump的时候执行。

### accessmask命令：
> 这个命令很简单，就是查询权限标志的，例如

```
0:000> !accessmask process 0x1fffff
Access mask: 0x1fffff

Generic rights:
STANDARD_RIGHTS_READ              (0x20000)
STANDARD_RIGHTS_WRITE             (0x20000)
STANDARD_RIGHTS_EXECUTE           (0x20000)
STANDARD_RIGHTS_REQUIRED          (0xf0000)
STANDARD_RIGHTS_ALL               (0x1f0000)
READ_CONTROL                      (0x20000)
DELETE                            (0x10000)
SYNCHRONIZE                       (0x100000)
WRITE_DAC                         (0x40000)
WRITE_OWNER                       (0x80000)

Specific rights:
PROCESS_QUERY_LIMITED_INFORMATION    (0x1000)
PROCESS_SUSPEND_RESUME            (0x800)
PROCESS_QUERY_INFORMATION         (0x400)
PROCESS_SET_INFORMATION           (0x200)
PROCESS_SET_QUOTA                 (0x100)
PROCESS_CREATE_PROCESS            (0x80)
PROCESS_DUP_HANDLE                (0x40)
PROCESS_VM_WRITE                  (0x20)
PROCESS_VM_READ                   (0x10)
PROCESS_VM_OPERATION              (0x8)
PROCESS_CREATE_THREAD             (0x2)
PROCESS_TERMINATE                 (0x1)
PROCESS_ALL_ACCESS                (0x1fffff)

```

其中第一个参数是对象类型，比如process，thread，file；第二个参数则是具体要查询的值。

### oledata命令：
> 这个命令是方便我们当前线程查询com和ole相关结构的命令，不需要参数。

```
0:000> !oledata
dt combase!tagSOleTlsData 0x0000019370ad0360
dx (combase!tagSOleTlsData *)0x0000019370ad0360
0:000> dt combase!tagSOleTlsData 0x0000019370ad0360
   +0x000 pvThreadBase     : (null)
   +0x008 pSmAllocator     : (null)
   +0x010 dwApartmentID    : 0x1e3d4
   +0x014 dwFlags          : 0x81
   +0x018 TlsMapIndex      : 0n0
   +0x020 ppTlsSlot        : 0x00000018`66fc9758  -> 0x00000193`70ad0360 Void
   +0x028 cComInits        : 3
   +0x02c cOleInits        : 0
   +0x030 cCalls           : 0
   ...
```
另外可以看[调试COM的一个tip](/2017/07/09/tip-about-com/)来简单了解以下这个命令的用途

### cppexcrname命令：
> 这个命令用于查询C++ 异常名

```
0:000> .exr -1
ExceptionAddress: 74e61812 (KERNELBASE!RaiseException+0x00000062)
   ExceptionCode: e06d7363 (C++ EH exception)
  ExceptionFlags: 00000001
NumberParameters: 3
   Parameter[0]: 19930520
   Parameter[1]: 006ff46c
   Parameter[2]: 00372294
0:000> !cppexcrname
Exception name: .?AVexception@std@@
```
这个的详情可以参考[C++异常的参数分析(0xE06D7363)](/2015/12/06/cpp-exception-params/)
