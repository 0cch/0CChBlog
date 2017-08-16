---
author: admin
comments: true
date: 2013-09-14 17:13:22+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8windbg-logexts%e7%9b%91%e6%8e%a7%e7%a8%8b%e5%ba%8fapi%e8%b0%83%e7%94%a8'
title: 使用Windbg Logexts监控程序API调用
wordpress_id: 337
categories:
- Debugging
- Tips
---

在我们调试BUG和逆向程序的时候，往往需要监控一些API的调用。这个时候我们可以借助调试器和第三方工具完成这样的任务。例如调试器可以下断点查看栈状态得到相关信息，或者使用第三方工具如API Monitor可以方便的监控API的调用。不过，这篇文章中想说的是另一个工具，Windbg的扩展程序Logexts.dll。闲话少说，我们先看一看监控的效果如何吧。

[![20130914230701](/uploads/2013/09/20130914230701.png)](/uploads/2013/09/20130914230701.png)

上图是Windbg输出的信息，再看看使用logviewer.exe查看的效果。

[![20130914234812](/uploads/2013/09/20130914234812.png)](/uploads/2013/09/20130914234812.png)

怎么样，是不是相当的不错！那么下面我就来简单介绍一下，这个扩展的用法。

!logexts.logi  
将Logger注入目标程序，初始化监控，但是并不开启它。

!logexts.loge  
开启监控，如果之前没有调用logexts.logi，这个扩展命令会先初始化监控，然后启动。

!logexts.logd  
停止监控。这个命令会摘掉所有的Hook，从而让程序自由运行。不过COM的Hook并不会被摘除。

!logexts.logo  
显示或者修改输出选项，这里有三种输出方式：1.在调试器中显示，2.输出到一个文本文件，3.输出到lgv文件。其中lgv文件会包含更多的信息，我们可以使用LogViewer进行查看。

!logexts.logc  
显示或者控制监控的API分类。

!logexts.logb  
显示或者刷新输出缓存。由于如果在监控过程中发生异常，那么扩展可能无法将记录的日志写入文件中，这个时候我们就需要这个命令，手动的将缓存中的数据写入文件。

!logexts.logm  
显示和创建模块的包含/排除列表。这可以帮助我们指定记录那些特定模块中的API调用。

上面图中我所使用的命令是这样的：

{% codeblock lang:windbg %}
>!logexts.loge D:\  
!logexts.logc d *  
!logexts.logc e 15 16 19  
!logexts.logo e *  
!logexts.logm i notepad.exe
{% endcodeblock %}

其输出结果是：

{% codeblock lang:windbg %}
!logexts.loge D:\  
Windows API Logging Extensions v3.01  
Parsing the manifest files...  
Location: C:\Program Files (x86)\Windows Kits\8.0\Debuggers\x64\winext\manifest\main.h  
Parsing file "main.h" ...  
Parsing file "winerror.h" ...  
Parsing file "kernel32.h" ...  
Parsing file "debugging.h" ...  
Parsing file "processes.h" ...  
Parsing file "memory.h" ...  
Parsing file "registry.h" ...  
Parsing file "fileio.h" ...  
Parsing file "strings.h" ...  
Parsing file "user32.h" ...  
Parsing file "clipboard.h" ...  
Parsing file "hook.h" ...  
Parsing file "gdi32.h" ...  
Parsing file "winspool.h" ...  
Parsing file "version.h" ...  
Parsing file "winsock2.h" ...  
Parsing file "advapi32.h" ...  
Parsing file "uuids.h" ...  
Parsing file "com.h" ...  
Parsing file "shell.h" ...  
Parsing file "ole32.h" ...  
Parsing file "ddraw.h" ...  
Parsing file "winmm.h" ...  
Parsing file "avifile.h" ...  
Parsing file "dplay.h" ...  
Parsing file "d3d.h" ...  
Parsing file "d3dtypes.h" ...  
Parsing file "d3dcaps.h" ...  
Parsing file "d3d8.h" ...  
Parsing file "d3d8types.h" ...  
Parsing file "d3d8caps.h" ...  
Parsing file "dsound.h" ...  
Parsing completed.  
Logexts injected. Output: "D:\\LogExts\"  
Logging enabled.  
0:000> !logexts.logc d *  
All categories disabled.  
0:000> !logexts.logc e 15 16 19  
15 IOFunctions Enabled  
16 MemoryManagementFunctions Enabled  
19 ProcessesAndThreads Enabled  
0:000> !logexts.logo e *  
Debugger Enabled  
Text file Enabled  
Verbose log Enabled  
0:000> !logexts.logm i notepad.exe  
Included modules:  
notepad.exe
{% endcodeblock %}

简单说明一下这些命令：  
!logexts.loge D:\  
设置log的保持路径，并且开启监控  

!logexts.logc d *  
先关闭所有API分类的监控  

!logexts.logc e 15 16 19  
然后设置我们想监控分类，这里是IOFunctions，MemoryManagementFunctions和ProcessesAndThreads。至于如何查询分类对于的id，可以直接输入!logexts.logc进行查看。

!logexts.logo e *  
这里我开启了所有输出方式，注意：如果想要被监控的程序响应的更快，可以去掉Debugger的输出，因为显示花费的时间比较的多。

!logexts.logm i notepad.exe  
最后当然是设置inclusion list了。

按下F5，让程序跑起来看看效果吧。先别着急惊叹，Logexts还有更惊艳的地方。那就是他的高度可配置性。如果你想监控他描述以外的API，那么你可以自己写这个API的“头文件”。这里用引号是因为，它并不是真正的头文件，只不过他的语法和C的头文件非常的相似。我们可以看一个例子：

创建%windbg_dir%\winext\manifest\Context.h  
并且写入这些内容

{% codeblock lang:cpp %}

category ActivationContext:
module KERNEL32.DLL:

FailOnFalse ActivateActCtx(HANDLE hActCtx, [out] PULONG_PTR lpCookie);
FailOnFalse DeactivateActCtx(DWORD dwFlags, ULONG_PTR upCookie);

 {% endcodeblock %}

在%windbg_dir%\winext\manifest\main.h文件的最后加入一行 #include "Context.h"

保存后，重启调试程序，输入!logexts.logc，可以看了多出了ActivationContext这一项。现在就可以选择这一项分类来监控ActivateActCtx和DeactivateActCtx了。

最后，大家应该发现了这样一个问题，开启这个API监控还是比较麻烦的，需要输入好几条命令。为了更方便的使用这个功能，我写了一个脚本来解决这个问题，这样就可以用一行命令来开启监控。使用方法是：  
Usage $$>a<logger.wds output_dir categories include_modules  
e.g. $$>a<logger.wds "d:\" "15 16 19" "notepad.exe"  

下载[logger](/uploads/2013/09/logger.zip)

关于Logexts的更多详细信息请参考msdn：[http://msdn.microsoft.com/en-us/library/windows/hardware/ff560170(v=vs.85).aspx](http://msdn.microsoft.com/en-us/library/windows/hardware/ff560170(v=vs.85).aspx)
