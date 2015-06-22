---
author: admin
comments: true
date: 2015-04-10 16:56:02+00:00
layout: post
slug: '%e9%98%b2%e6%ad%a2global-windows-hooks%e6%b3%a8%e5%85%a5%e7%9a%84%e4%b8%80%e4%b8%aa%e6%96%b9%e6%b3%95'
title: 防止Global Windows Hooks注入的一个方法
wordpress_id: 543
categories:
- NTInternals
- Tips
---

我们都知道SetWindowsHookEx可以设置全局钩子，让自己的dll注入到有窗口的进程中去。注入原理就不再赘述了，网上资料很多，简单看一下调用堆栈方便我们说明怎么去防注入。
kernel32!LoadLibraryExW
USER32!__ClientLoadLibrary
ntdll!KiUserCallbackDispatcher
nt!KiCallUserMode
nt!KeUserModeCallback
win32k!ClientLoadLibrary
win32k!xxxLoadHmodIndex
win32k!xxxCallHook2
win32k!xxxCallHook
win32k!xxxCreateWindowEx
win32k!NtUserCreateWindowEx
nt!KiFastCallEntry
ntdll!KiFastSystemCallRet
ntdll!KiUserCallbackDispatcher
USER32!NtUserCreateWindowEx
USER32!_CreateWindowEx

看着个堆栈，防注入的方法这里就可以大概说出三种：
1. 被创建窗口程序了。
2. Hook LoadLibraryExW，判断是否是自己的模块。
3. Hook __ClientLoadLibrary，替换为空函数。

第一个方法其实也谈不上方法，也就是说控制台程序就不用担心这些了。第二个方法需要是否是判断自己的模块，这个方法也挺麻烦的，因为你得放过一些不是自己的模块，比如微软的模块。所以这里重点说第三个方法，我们去Hook __ClientLoadLibrary，这样我们就只是避免了全局钩子的注入了。这里我们不用去Inline Hook该函数，Inline Hook比较麻烦。我们的做法是修改user32!apfnDispatch这个数组，直接替换对应于__ClientLoadLibrary所在位置的值。这样摆在我们面前的稍微麻烦一点的事情有两个，一个是确定数组开始的地址，第二就是确定__ClientLoadLibrary在数组中的index。
那么分别来解决这两个问题：

1. 组数的位置
其实就是PEB的KernelCallbackTable，虽然PEB没有文档化，但是也没见过他变过什么。所以我们可以写死KernelCallbackTable的偏移。说稍微有点麻烦就是指的，这个偏移在32bit和64bit的系统上是不同的而已，32位系统的偏移是0x2c，64位系统是0x58。另外一个就是获得PEB的方法了，32位程序你既可以写点汇编从fs中获取，也能调用__readfsdword获得，64位程序会麻烦点，你需要先获得TEB，然后从TEB里得到PEB，至于获得TEB的方法，你可以直接调用__readgsqword获得，也可以调用ntdll的NtCurrentTeb获得。

2. __ClientLoadLibrary在数组中的index
这个就稍微繁琐点，我们需要把我们关心的系统用windbg带上符号都看一眼才能知道是多少了。
我这里提供几个常用系统中__ClientLoadLibrary在数组中的index：
XP=0x42，Win7=0x41，Win8.1=0x47

好了，知道了这些，后面的就不用说太详细了，无非就是这三步：
1. 写个空的__ClientLoadLibrary函数MyClientLoadLibrary。
2. VirtualProtect设置KernelCallbackTable + index * sizeof(PVOID)地址内存保护属性为PAGE_READWRITE。
3. 替换__ClientLoadLibrary为MyClientLoadLibrary，再把内存属性换回原来的。

OK，大功告成了。
