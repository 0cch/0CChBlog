---
author: admin
comments: true
date: 2015-07-13 00:20:57+00:00
layout: post
slug: 'monitor-process-with-wmi'
title: 使用WMI监控进程创建和结束
categories:
- Tips
---

Windows Management Instrumentation (WMI) 是微软实现的一套可以通过网页管理计算机的系统，我们可以通过WMI查询计算机的方方面面。从Vista开始，这个机制增加了Instance Event的提醒机制，这个机制可以帮助我们监控各种Instance的创建、删除和修改。所以，我们可以想到的是进程也是在WMI里的Win32_Process有Instance的记录，这样我们就可以跟踪到进程的创建和结束了。当然，我们还可能监控到文件等等WMI里的各种Instance。下面是一个监控进程的例子：

[![20150712232158](/uploads/2015/07/20150712232158.png)](/uploads/2015/05/20150712232158.png)

下载：[MonitorProcessWithWMI.zip](/uploads/2015/07/MonitorProcessWithWMI.zip)