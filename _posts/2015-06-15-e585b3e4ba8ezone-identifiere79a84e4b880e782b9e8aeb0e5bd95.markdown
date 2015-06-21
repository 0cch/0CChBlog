---
author: admin
comments: true
date: 2015-06-15 08:07:03+00:00
layout: post
slug: '%e5%85%b3%e4%ba%8ezone-identifier%e7%9a%84%e4%b8%80%e7%82%b9%e8%ae%b0%e5%bd%95'
title: 关于Zone.Identifier的一点记录
wordpress_id: 562
categories:
- NT Internals
- Tips
---

自从Windows XP SP2开始，微软对文件加入了Zone.Identifier的数据流，所以这个也不算什么新东西了，最近偶然有机会研究了下所以就记录了下来。
说起Zone.Identifier，我们最常见的应用就是在我们从Internet上下载了可执行文件后，运行的时候会弹出如下图的警告窗口：
[![20150615150628](/uploads/2015/06/20150615150628.png)](/uploads/2015/06/20150615150628.png)
弹出这个窗口就是因为Explorer在运行这个文件的时候先检查了Zone.Identifier的数据，发现了如下文本
[ZoneTransfer]
ZoneId=3

这个ZoneId=3，就是指明这个文件是由Internet上下载的。根据MSDN，这个id有以下几种：

{% highlight cpp linenos %}
typedef enum tagURLZONE { 
  URLZONE_INVALID         = -1,
  URLZONE_PREDEFINED_MIN  = 0,
  URLZONE_LOCAL_MACHINE   = 0,
  URLZONE_INTRANET,
  URLZONE_TRUSTED,
  URLZONE_INTERNET,
  URLZONE_UNTRUSTED,
  URLZONE_PREDEFINED_MAX  = 999,
  URLZONE_USER_MIN        = 1000,
  URLZONE_USER_MAX        = 10000
} URLZONE;
 {% endhighlight %}
查看这个数据流的方法也很简单，用notepad就行了。
[![20150615153805](/uploads/2015/06/20150615153805.png)](/uploads/2015/06/20150615153805.png)
另外如果想给添加或者去除这个数据流，我们这里有两种方法：
1.直接读写数据流，其实这个跟普通文件读写没什么两样。
2.调用微软提供的com接口，这个比较是规范的。

对于第一种方法，没什么可说的，无非就是文件操作的那些API。第二种方法我们需要用到以下两个接口：
IPersistFile
IZoneIdentifier

我们先创建IZoneIdentifier接口，然后query出IPersistFile打开文件，最后读取或者写入文件。
代码详见：http://blogs.msdn.com/b/oldnewthing/archive/2013/11/04/10463035.aspx

最后说一下，之所以能有Zone.Identifier这种功能，完全依赖于NTFS文件系统，它允许多个数据流的存在，对它而言，每个数据流无非就是一个属性而已，只不过Zone.Identifier是一个名字为Zone.Identifier的数据流，而文件本身的数据是一个没有命名的数据流而已。用ntfs_study查看，如下图，第一个Data数据没有名字是文件本身的数据，第二个就是Zone.Identifier的数据了。
[![20150615160110](/uploads/2015/06/20150615160110.png)](/uploads/2015/06/20150615160110.png)
