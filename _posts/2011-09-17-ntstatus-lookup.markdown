---
author: admin
comments: true
date: 2011-09-17 14:39:26+00:00
layout: post
slug: ntstatus-lookup
title: NTSTATUS Lookup
wordpress_id: 52
categories:
- Debugging
tags:
- NTSTATUS
---

磁盘快照写好了后，闲着无聊写了个nslookup，用来看驱动返回值解释的。写这个程序还先写了个nsstatus.h的解析工具。生成了一个超大的switch case。没啥技术含量。至于那个磁盘快照的代码，过段时间如果合适也可以共享出来。

[![](/uploads/2011/09/ntstatus.jpg)](/uploads/2011/09/ntstatus.jpg)

1.0.0.2 更新：

1.增加程序初始化时，直接读取剪切板中的数据功能。
2.增加对输入的判断，支持“0x”前缀。

下载：

[download id="1"]
