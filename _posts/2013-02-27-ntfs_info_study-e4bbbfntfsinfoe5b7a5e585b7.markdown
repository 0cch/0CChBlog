---
author: admin
comments: true
date: 2013-02-27 16:00:25+00:00
layout: post
slug: ntfs_info_study-%e4%bb%bfntfsinfo%e5%b7%a5%e5%85%b7
title: ntfs_info_study —— 仿NtfsInfo工具
wordpress_id: 169
categories:
- NTInternals
---

ntfs_info_study 这个工具可以显示ntfs卷的一些信息。主要也是学习NtfsInfo的功能，而仿造的一个小工具。ntfs_info_study能显示的信息包括卷大小，扇区数量，簇数量，扇区字节数，簇字节数，主文件表每条记录字节数以及主文件表的一些信息。当然它还可以显示部分NTFS系统文件的信息，例如：$Volume。

实际上ntfs_info_study稍微修复了NtfsInfo的一个问题。原来的NtfsInfo已经无法显示NTFS系统文件的信息了。原因是这个工具调用FindFirstFile这样的函数来查找NTFS系统文件。我不知道什么版本的Windows可以这么做，至少现在Windows 7上，这个方法是行不通的。所以在我从写的工具里，是先打开系统文件，然后查询文件信息，但是普通的CreateFile是打不开这些文件的，这里我的方法是调用OpenFileById。不过实际上，我还没找到正规而且完美显示所有NTFS系统文件的方法，因为部分系统文件在打开的时候会提示访问拒绝。

当然不正规的但是却比较完美的查看NTFS系统文件的方法也有，就是直接打开卷，解析NTFS文件系统数据结构。这个功能已经在[ntfs_study](http://0cch.net/wordpress/?p=117)中实现了，具体可以移步这个[链接](http://0cch.net/wordpress/?p=117)。

[![20130227235402](/uploads/2013/02/20130227235402.png)](/uploads/2013/02/20130227235402.png)

以上是一副对比图，其他功能是一样的，唯一的区别就是最后一项中，ntfs_info_study能够显示部分NTFS系统文件信息。


>Usage: ntfs_info_study.exe <drive letter>


使用方法自然也不必说明了，有兴趣的各位可以下载玩玩。

下载[ntfs_info_study](/uploads/2013/02/ntfs_info_study.zip)
