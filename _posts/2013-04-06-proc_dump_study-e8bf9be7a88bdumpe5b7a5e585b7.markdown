---
author: admin
comments: true
date: 2013-04-06 09:00:41+00:00
layout: post
slug: proc_dump_study-%e8%bf%9b%e7%a8%8bdump%e5%b7%a5%e5%85%b7
title: proc_dump_study —— 进程dump工具
wordpress_id: 208
categories:
- Debugging
- NTInternals
---

proc_dump_study是逆向sysinternals的Procdump的一个工具。在功能上几乎和procdump一模一样。有一点差距就是目前没有支持clr的异常，也就是procdump的-g参数。其他的usage基本上相同，这里也不细说了。想说的一点是，proc_dump_study和procdump一样，功能比较强大，参数也比较多。所以为了方便使用，我把用的比较多的功能总结了一下，写了一个带UI shell程序。这样就方便测试人员或者不想深入理解命令行程序的人员使用。

[![20130404013936](/uploads/2013/04/20130404013936.png)](/uploads/2013/04/20130404013936.png)



简单介绍一下使用方法  
1.选择要监控或者dump的进程，确定生成dump的文件位置。  
2.选择dump类型，包括mini dump，full dump以及effective dump，dump的大小分别为小，大，中等。  
3.选择是否监控进程的cpu使用率  
4.选择是否监控进程的内存提交数量  
5.选择是否监控进程窗口是否挂起  
6.选择是否监控进程发生异常  
7.选择是否监控进程推出  
8.最后点击dump按钮  

这样，一旦监控的时候任何监控点达到要求，就会产生dump文件了。如果不需要监控任何进程窗口，程序会立刻dump进程。实际上直接使用proc_dump_study会有更多的功能可以使用，不过这个UI版本应该可以应付大多数的情况了吧。

下载[proc_dump_ui](/uploads/2013/04/proc_dump_ui.zip)

最后放一张测试图  
[![20130402230714](/uploads/2013/04/20130402230714.png)](/uploads/2013/04/20130402230714.png)
