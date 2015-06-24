---
author: admin
comments: true
date: 2014-02-23 14:09:44+00:00
layout: post
slug: guid-tool-%e4%b8%80%e4%b8%aa%e8%bd%ac%e6%8d%a2guid%e6%a0%bc%e5%bc%8f%e7%9a%84%e5%b0%8f%e5%b7%a5%e5%85%b7
title: GUID TOOL —— 一个转换GUID格式的小工具
wordpress_id: 408
categories:
- Tips
---

周末闲来无事，逆向点有趣的功能的时候遇到这样一个问题。有些16进制的数貌似就是GUID，但是需要转换为注册表形式，才方便在注册表里面搜索。所以就写了个小工具转换16进制，C语言格式以及注册表格式的GUID。

usage: guid.exe <<-r|-c|-h> guid_string> | <-g>  
-r Format registry guid string.  
-c Format C code guid string.  
-x Format HEX guid string.  
-g Create new guid.  

[![20140223220404](/uploads/2014/02/20140223220404-1024x549.png)](/uploads/2014/02/20140223220404.png)



[![20140223220314](/uploads/2014/02/20140223220314-1024x570.png)](/uploads/2014/02/20140223220314.png)



下载：[guid](/uploads/2014/02/guid.zip)
