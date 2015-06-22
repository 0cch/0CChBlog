---
author: admin
comments: true
date: 2013-03-16 14:34:42+00:00
layout: post
slug: find_links_study-%e4%bb%bffindlinks%e7%9a%84%e6%96%87%e4%bb%b6%e7%a1%ac%e9%93%be%e6%8e%a5%e6%9f%a5%e6%89%be%e5%b7%a5%e5%85%b7
title: find_links_study —— 仿FindLinks的文件硬链接查找工具
wordpress_id: 191
categories:
- NTInternals
---

在上一篇讨论[hardlink](http://0cch.net/wordpress/?p=179)的文章中，我在最后提到要写一个查找hardlinks的工具。正如上一篇文章中介绍这种工具的工作原理一样，他的代码比较简单。所以前几天find_links_study就已经写完了，只是一直没空发出来。这个工具的使用和FindLinks一模一样，这里也不多做介绍了。下图是工具的工作效果：

[![20130316214417](/uploads/2013/03/20130316214417.png)](/uploads/2013/03/20130316214417.png)



从图中我们可以发现，原来我们在系统中看到的多个notepad文件实际上就是一个文件而已，只不过他利用了hardlink的技术，产生了多个路径罢了。我感觉hardlink还是一个非常实用的技术，具体用在哪大家可以发挥想象力。就我个人看来，在某些情况下，用hardlink来备份文件，倒是一种不错的选择。

下载[find_links_study](/uploads/2013/03/find_links_study.zip)[
](/uploads/2013/03/find_links_study.zip)
