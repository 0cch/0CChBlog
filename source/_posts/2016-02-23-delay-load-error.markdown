---
author: admin
comments: true
date: 2016-02-23 00:55:58+00:00
layout: post
slug: 'delay-load-error'
title: c06d007f异常的解决方法
categories:
- debugging
---

c06d007f这个异常通常是在PE的延迟加载dll的时候发生的，加载器找不到对应的dll就会抛出这个异常。如果我们对这个异常不熟悉，按照常规方式去找上下文，那么结果肯定会让你失望。例如3.2526.1373.0版本的libcef在XP上运行的情况。

{% codeblock lang:windbg %}

0:000> kb
 # ChildEBP RetAddr  Args to Child              
00 0012f218 7c92d9ac 7c86449d d0000144 00000004 ntdll!KiFastSystemCallRet
01 0012f21c 7c86449d d0000144 00000004 00000000 ntdll!ZwRaiseHardError+0xc
02 0012f4a0 7c843892 0012f4c8 7c839b21 0012f4d0 kernel32!UnhandledExceptionFilter+0x628
03 0012f4a8 7c839b21 0012f4d0 00000000 0012f4d0 kernel32!BaseProcessStart+0x39
04 0012f4d0 7c9232a8 0012f5bc 0012ffe0 0012f5d4 kernel32!_except_handler3+0x61
05 0012f4f4 7c92327a 0012f5bc 0012ffe0 0012f5d4 ntdll!ExecuteHandler2+0x26
06 0012f5a4 7c92e46a 00000000 0012f5d4 0012f5bc ntdll!ExecuteHandler+0x24
07 0012f5a4 00000000 00000000 0012f5d4 0012f5bc ntdll!KiUserExceptionDispatcher+0xe
WARNING: Frame IP not in any known module. Following frames may be wrong.
08 0012fff4 004a991e 00000000 78746341 00000020 0x0
09 0012fff8 00000000 78746341 00000020 00000001 cefclient!pre_c_init+0xb9 [f:\dd\vctools\crt_bld\self_x86\crt\src\crtexe.c @ 261]

0:000> .cxr 0012f5d4;k
eax=0012f8a4 ebx=1314a58c ecx=00000000 edx=00000001 esi=0012f954 edi=68d60000
eip=00000000 esp=0012fff8 ebp=00000000 iopl=0         nv up ei pl nz na po nc
cs=001b  ss=0023  ds=0023  es=0023  fs=003b  gs=0000             efl=00000202
00000000 ??              ???
  *** Stack trace for last set context - .thread/.cxr resets it
 # ChildEBP RetAddr  
WARNING: Frame IP not in any known module. Following frames may be wrong.
00 0012fff4 004a991e 0x0
01 0012fff8 00000000 cefclient!pre_c_init+0xb9 [f:\dd\vctools\crt_bld\self_x86\crt\src\crtexe.c @ 261]

{% endcodeblock %}

直接看栈回溯或者通过设置cxr看栈回溯，并没有帮助我们找到什么有用的信息。

这里要使用的方法是，利用异常的参数来找到具体延迟加载谁的时候发生了异常。

{% codeblock lang:windbg %}

0:000> .exr 0012f5bc 
ExceptionAddress: 7c812aeb (kernel32!RaiseException+0x00000053)
   ExceptionCode: c06d007f
  ExceptionFlags: 00000000
NumberParameters: 1
   Parameter[0]: 0012f918
   
{% endcodeblock %}

这里的参数0，就是我们要找的目标，记录了出错时候ebp-0x30的数据，也就是含有关键信息的地方。让我们仔细看看：

{% codeblock lang:windbg %}

0:000> dds 0012f918
0012f918  00000024
0012f91c  1314a58c libcef!_DELAY_IMPORT_DESCRIPTOR_dbghelp_dll
0012f920  13181dbc libcef!_imp__SymGetSearchPathW
0012f924  12ebdd20 libcef!_sz_dbghelp_dll
0012f928  00000001
0012f92c  1314ac8e libcef!dxva2_NULL_THUNK_DATA_DLN+0x7e
0012f930  68d60000 dbghelp!_imp__CryptAcquireContextA <PERF> (dbghelp+0x0)
0012f934  00000000
0012f938  0000007f
0012f93c  1314c138 libcef!dxva2_NULL_THUNK_DATA_DLN+0x1528
0012f940  00000003
0012f944  00000000
0012f948  0012f9f8
0012f94c  11d17587 libcef!_tailMerge_dbghelp_dll+0xd
0012f950  0012f918
0012f954  13181dbc libcef!_imp__SymGetSearchPathW
0012f958  00000008
0012f95c  7c9301bb ntdll!RtlAllocateHeap+0xeac
0012f960  1019014e libcef!base::debug::`anonymous namespace'::InitializeSymbols+0x9e [f:\stnts\browser\cef\ws\src\chromium\src\base\debug\stack_trace_win.cc @ 79]
0012f964  ffffffff
0012f968  00170880

{% endcodeblock %}


我们可以清楚的看到加载器延迟加载SymGetSearchPathW的时候发生了问题。让我们进一步用depends工具验证一下

[![20160223003624](/uploads/2016/02/20160223003624.png)](/uploads/2016/02/20160223003624.png)

如上图所示，XP自带的dbghelp里没有SymGetSearchPathW这个导出函数。要解决这个异常，实际上就需要在运行目录里添加一个稍微新一点的dbghelp文件，我这里替换的是6.2.9200.16384的dbghelp，替换过后问题已经不再出现了。

[![20160223003711](/uploads/2016/02/20160223003711.png)](/uploads/2016/02/20160223003711.png)