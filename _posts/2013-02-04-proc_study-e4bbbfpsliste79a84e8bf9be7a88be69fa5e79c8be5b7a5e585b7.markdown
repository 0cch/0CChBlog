---
author: admin
comments: true
date: 2013-02-04 12:45:01+00:00
layout: post
slug: proc_study-%e4%bb%bfpslist%e7%9a%84%e8%bf%9b%e7%a8%8b%e6%9f%a5%e7%9c%8b%e5%b7%a5%e5%85%b7
title: proc_study —— 仿PsList的进程查看工具
wordpress_id: 147
categories:
- NTInternals
---

proc_study 是我通过逆向PsList而写出来的小工具，如果在本地查看进程，这个工具和pslist没有任何区别。因为实现查看进程的方式也是和pslist一模一样的。另一方面，他缺乏pslist的查看远程计算机的进程的功能。没有实现这个并不是不知道怎么实现，是我半天也没搭建出这样的一个远程环境，真够郁闷的。这个应该是年前的最后一个study系列的工具了。期待蛇年有时间山寨更多工具，嘿嘿~~~

[![20130204204101](/uploads/2013/02/20130204204101.png)](/uploads/2013/02/20130204204101.png)

这个工具的使用方法和命令行参数可以直接参看PsList的。因为整个Usage我都是直接山寨过来的。

Usage: proc_study [-d][-m][-x][-t][name|pid]
-d      Show thread detail.
-m     Show memory detail.
-x      Show processes, memory information and threads.
-t       Show process tree.
name Show information about processes that begin with the name
specified.
-e      Exact match the process name.
pid Show information about specified process.

All memory values are displayed in KB.
Abbreviation key:
Pri Priority
Thd Number of Threads
Hnd Number of Handles
VM Virtual Memory
WS Working Set
Priv Private Virtual Memory
Priv Pk Private Virtual Memory Peak
Faults Page Faults
NonP Non-Paged Pool
Page Paged Pool
Cswtch Context Switches

下载[proc_study](/uploads/2013/02/proc_study.zip)
