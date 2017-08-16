---
author: admin
comments: true
date: 2016-02-01 21:15:3+00:00
layout: post
slug: 'app-cpr-event'
title: 调试器最早的中断应用程序的方法
categories:
- debugging
---

这篇Blog分享一个Windbg的小技巧，就是让被调试程序更早的中断到调试器。熟悉Windbg的朋友都知道，用调试器运行程序，默认情况下都会中断到ntdll!LdrpDoDebuggerBreak。但是有时候我们会想去调试程序加载的过程，这个时候就需要我们更早的中断下来。那么这里就用利用到调试器最早接受到的调试事件了。CREATE_PROCESS_DEBUG_EVENT，这个调试事件是创建进程的时候进程发给调试器的，在这个时候，你甚至连ntdll都没有完成加载，这也导致ntdll的符号无法加载，很多有用的功能用不上。但幸运的是，虽然ntdll没有完成加载，但是已经加载到了内存，另外我们可以用手动加载符号的方法，把符号文件加载到ntdll的内存上去。

演示如下：

windbg.EXE -xe cpr -xe ld notepad.exe

这里设置中断系统事件cpr，也就是CREATE_PROCESS_DEBUG_EVENT

{% codeblock lang:windbg %}

0:000> lm
start             end                 module name
00007ff7`3f6e0000 00007ff7`3f721000   notepad    (deferred)             
0:000> !teb
TEB at 000000d995d21000
error InitTypeRead( TEB )...

{% endcodeblock %}

中断下来后我们可以看到，!teb是没法用的

{% codeblock lang:windbg %}

0:000> .imgscan
MZ at 00007ff7`3f6e0000, prot 00000002, type 01000000 - size 41000
  Name: notepad.exe
MZ at 00007ffb`7c7b0000, prot 00000002, type 01000000 - size 1c1000
  Name: ntdll.dll
0:000> .reload /f ntdll.dll=00007ffb`7c7b0000

{% endcodeblock %}

我们需要找到ntdll的模块，然后手动加载符号，然后就可以使用和ntdll有关系的命令了。

{% codeblock lang:windbg %}

0:000> lm
start             end                 module name
00007ff7`3f6e0000 00007ff7`3f721000   notepad    (deferred)             
00007ffb`7c7b0000 00007ffb`7c971000   ntdll      (pdb symbols)          e:\workspace\mysymbols\ntdll.pdb\F296699DB5314A06935E88564D8CD2731\ntdll.pdb

0:000> !teb
TEB at 000000d995d21000
    ExceptionList:        0000000000000000
    StackBase:            000000d995af0000
    StackLimit:           000000d995adf000
    SubSystemTib:         0000000000000000
    FiberData:            0000000000001e00
    ArbitraryUserPointer: 0000000000000000
    Self:                 000000d995d21000
    EnvironmentPointer:   0000000000000000
    ClientId:             0000000000001c8c . 00000000000017c4
    RpcHandle:            0000000000000000
    Tls Storage:          0000000000000000
    PEB Address:          000000d995d20000
    LastErrorValue:       0
    LastStatusValue:      0
    Count Owned Locks:    0
    HardErrorMode:        0

{% endcodeblock %}