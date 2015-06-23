---
author: admin
comments: true
date: 2015-03-26 08:08:33+00:00
layout: post
slug: '%e5%8f%91%e7%8e%b0file-system-minifilter%e7%9a%84%e4%b8%80%e5%a4%84%e9%97%ae%e9%a2%98'
title: 发现File System Minifilter的一处问题
wordpress_id: 538
categories:
- NTInternals
- Tips
---

这两天有个朋友一直问我用用户普通权限连接minifilter server port的问题。给他解答的同时，也发现了这个方面的一个问题。首先说用普通用户权限连接port的方法，其实就是设置FltCreateCommunicationPort参数里ObjectAttributes的SecurityDescriptor，加入everyone的ACE就行了。那么加入everyone的ace你就要指定一个ACCESS_MASK，在MSDN里，介绍了两个可以使用的MASK

[![20150326155009](/uploads/2015/03/20150326155009.png)](/uploads/2015/03/20150326155009.png)

其中FLT_PORT_CONNECT=1，FLT_PORT_ALL_ACCESS=1F0001。看到这里，多数人都可能会认为如果只想让everyone连接上去，不给他所用权限，那么在这个ACE里加入FLT_PORT_CONNECT就可以了。然后就掉到微软的坑里了，和我那个朋友一样:)。

[![20150326154028](/uploads/2015/03/20150326154028.png)](/uploads/2015/03/20150326154028.png)

实际上指定FLT_PORT_CONNECT会让R3的程序无法连接驱动的port，原因就是FilterConnectCommunicationPort函数没有让你指定你需求的ACCESS，而是在底层打开port的时候直接请求FLT_PORT_ALL_ACCESS。这个时候如果你的ACE里面是FLT_PORT_CONNECT，那当然无法连接上去了。所以这里把ACE里的ACCESS_MASK设置为FLT_PORT_ALL_ACCESS就行了。

