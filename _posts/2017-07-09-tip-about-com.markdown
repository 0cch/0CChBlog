---
author: admin
comments: true
date: 2017-07-09 11:28:15+00:00
layout: post
slug: 'tip-about-com'
title: 调试COM的一个tip
categories:
- Tips
---

最近遇到朋友的一个程序崩溃，原因是接口没有释放的时候调用了CoUninitialize，接着才释放接口。这个应该是个很明显的问题，但是朋友告诉我以前代码就是这个样子的，没有崩溃过，最近修改了部分代码但并不是这一块的。为了看看究竟什么回事，我把没有崩溃的程序抓了dump，看了COM的初始化引用计数：

```
0:000> dt _teb @$teb ReservedForOle
ntdll!_TEB
   +0x1758 ReservedForOle : 0x00000000`00271b00 Void

0:000> dt ole32!SOleTlsData 0x00000000`00271b00 cComInits pNativeApt
   +0x028 cComInits  : 5
   +0x080 pNativeApt : 0x00000000`00272680 CComApartment
   
0:000> dt 0x00000000`00272680 CComApartment _AptKind
ole32!CComApartment
   +0x010 _AptKind : 4 ( APTKIND_APARTMENTTHREADED )
   
```

没有崩溃的时候，引用计数确实不为0，也能看出是个STA。后来朋友发现，之所以之前没有崩溃，是因为之前线程加载的某个dll中，有初始化COM的调用，所以引用计数不为0。后来移开了这个dll，问题就出现了。