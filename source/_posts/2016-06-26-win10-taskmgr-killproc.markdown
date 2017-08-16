---
author: admin
comments: true
date: 2016-06-26 11:09:30+00:00
layout: post
slug: 'win10-taskmgr-killproc'
title: Windows 10 任务管理器结束任务流程
categories:
- Tips
---

从Win8开始，任务管理已经悄然发生变化了，这篇文章要说的就是结束任务这一个功能。以Win10的任务管理器为主来说明，没有了从窗口关闭进程的标签。取而代之的是一个区分前台和后台程序的进程树。通过这个界面结束进程也不再像以前一样调用User32的EndTask(https://msdn.microsoft.com/en-us/library/windows/desktop/ms633492(v=vs.85).aspx)，而是重新规划了一套逻辑。

具体逻辑如下：  

> 1.区分程序类型  
>
> 2.如果是窗口程序，则给窗口发送WM_SYSCOMMAND+SC_CLOSE结束窗口来结束进程  
>
> 3.如果是服务程序，则调用ControlService+SERVICE_CONTROL_STOP结束服务来结束进程  
>
> 4.如果既没有窗口也不是服务的程序，或者说在第2，3步没有结束成功的进程，会调用TerminateProcess来强行结束进程。  
>
>  5.第五步是和之前结束任务最大的一个区别，以前的任务管理器，如果没能结束进程，例如一些僵尸进程，他就不会做其他动作了，而新的任务管理器为了释放这种进程所占用的内核资源，他还会做另外一些事情，那就是关闭目标进程的所有句柄。使用的方式就是DuplicateHandle+DUPLICATE_CLOSE_SOURCE。这样做的另外一个好处就是，如果顽固进程还在运行，句柄关闭会造成其崩溃而结束。