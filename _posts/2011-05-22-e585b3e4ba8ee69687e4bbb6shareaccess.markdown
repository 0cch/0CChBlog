---
author: admin
comments: true
date: 2011-05-22 18:26:22+00:00
layout: post
slug: '%e5%85%b3%e4%ba%8e%e6%96%87%e4%bb%b6shareaccess'
title: 关于文件ShareAccess
wordpress_id: 15
categories:
- NTInternals
tags:
- File System
- NTInternals
- NTFS
---

我是真心太懒了，虽然平时也在研究一些东西，但是总是理解了就算了，没有把他们记录下来的想法。虽然不记录下来也不至于会忘记，但是人的记忆总是有限的我也不敢保证记忆完全不错。好不容易说服自己写点东西，就从今天看的那点东西写起吧。

（吐槽：我尽量把以后的文章写得详细以至于啰嗦，免得以后自己又看不懂了。）

什么是ShareAccess。我们做一个简单的实验，进入系统目录(一般就是C:\Windows\)。在C:\Windows\system32\config中，复制一个SYSTEM文件，然后把文件粘贴到另一个地方。如果我们的系统正常，那么我们看到肯定是一个错误框。（图1）“无法复制 system: 文件正在被另一个人或程序使用。关闭任何可能使用这个文件的程序，重新试一次。”无论懂不懂编程，这样一个令人蛋疼的错误框应该会看过无数次吧。这里我就不解释Windows为什么要这么做，假设所有读者都是了解其中的原因了。这篇文章想介绍的是，Windows怎么做到“访问拒绝”的。简单的来说就是当一个进程打开该文件的时候ShareAccess中没有ShareRead属性，所以其他的进程无法访问他。

[![](/uploads/2011/05/Windows-XP-Professional-2011-05-23-01-51-31-300x225.png)](/uploads/2011/05/Windows-XP-Professional-2011-05-23-01-51-31.png)

（图1）

在我们平时打开文件中（CreateFile）总是需要我们传入一个dwShareMode的参数。它有三个值分别是FILE_SHARE_DELETE，FILE_SHARE_READ，FILE_SHARE_WRITE。如果一个打开一个文件的时候，没有传入了FILE_SHARE_READ，那么如果有另一段代码对文件用FILE_READ_DATA权限打开的时候一定返回的是一个失败。其他两个SHARE也是一样。那么是不是设置了FILE_SHARE_READ，其他代码用FILE_READ_DATA权限打开该文件都会成功呢？答案是不一定，主要要看在这段代码CreateFile的dwShareMode。如果也设置的FILE_SHARE_READ，那么打开文件就会成功，否则返回一个SHARE错误。

（吐槽：上面说了一堆，还是没进入正题，貌似有点太详细了。接下来才是重头戏。）

来看看NTFS文件系统是怎么来Check权限的。
每个文件打开的时候系统会为文件分配一个FILE_OBJECT（文件对象）。在这里我们主要关注的是以下几个域。
{% highlight asm %}
nt!_FILE_OBJECT
...
+0x00c FsContext        : Ptr32 Void
...
+0x026 ReadAccess       : UChar
+0x027 WriteAccess      : UChar
+0x028 DeleteAccess     : UChar
+0x029 SharedRead       : UChar
+0x02a SharedWrite      : UChar
+0x02b SharedDelete     : UChar
...
{% endhighlight %}
熟悉NTFS文件系统的同学都知道FsContext实际上是对应着一个SCB。SCB的数据结构是未公开的，所以只有逆向或者通过其他途径获得。而这篇文章只需要关注的是SCB的SHARE_ACCESS。SHARE_ACCESS在SCB的0x60的偏移处，这个和NT的SCB有些不同。SHARE_ACCESS的数据结构是这样

{% highlight cpp %}
typedef struct _SHARE_ACCESS {
ULONG OpenCount;
ULONG Readers;
ULONG Writers;
ULONG Deleters;
ULONG SharedRead;
ULONG SharedWrite;
ULONG SharedDelete;
} SHARE_ACCESS, *PSHARE_ACCESS;
{% endhighlight %}
这个就是这篇文章的关键。

当一个文件被打开的时候，系统会初始化这个数据结构。根据CreateFile的权限设置来填充这个结构。
比如DesiredAccess中设置了FILE_READ_DATA，那么Readers，OpenCount就会增加1，如果在此同时设置了ShareMode为FILE_SHARE_READ，那么SharedRead也会加1。同时FILE_OBJECT的ReadAccess和SharedRead会被设置为TRUE。那么在文件被关闭的时候，如果FILE_OBJECT的ReadAccess和SharedRead为TRUE，那么SHARE_ACCESS的Readers，OpenCount，SharedRead就会减1。

在进程准备去打开一个已经打开的文件时，文件系统会做一系列的检查，包括文件权限（比如如果是只读文件，你却想要写权限，这样就会失败），安全描述符，以及共享权限（ShareAccess）。假设前面两个都符合要求，那么就到了共享权限的检查了。

还是以刚才那个SYSTEM文件为例，他打开的权限是FILE_READ_DATA，FILE_WRITE_DATA，DELETE。那么SHARE_ACCESS的OpenCount，Readers，Writers，Deleters都为1，而完全没有Share的意图，所以其他的域都是0。

当有另外一段代码去试图用FILE_READ_DATA权限打开这个文件的时候，那么文件系统就会去检查第一个打开这个文件的操作共享权限。这时的OpenCount是1，SharedRead是0，他会发现SharedRead小于OpenCount，那么他认为这个文件并没有SHARE_READ，所以参数检查返回失败，你会得到一个共享错误。这就是为什么我们复制粘贴SYSTEM文件的时候会失败。

原因分析到这里就结束了。但是我就这样满足了么？显然我没那么容易满足滴~

我想做的就是复制出这个SYSTEM文件，实际上网上已经有很多做法，什么底层磁盘解析读取数据，句柄复制大法。而我这次是修改底层SCB的ShareAccess来达到复制的目的。如果读懂了上面的原理，看下面这段代码就很轻松了。


{% highlight cpp %}
kfile File;
ns = File.Create(FILENAME, FILE_OPEN, FILE_READ_ATTRIBUTES, 0);
FileObj = File.GetObject();
ShareAccess = (SHARE_ACCESS *)((ULONG)FileObj->FsContext + Offset);
ShareAccess->SharedRead = ShareAccess->Readers;
File.Release();
 {% endhighlight %}

OK，编写好测试代码，生成一个驱动。运行即可。接下来就是见证奇迹的时刻了。还是用同样的方法复制看看，完全没有问题了。（图2）

[![](/uploads/2011/05/Windows-XP-Professional-2011-05-23-01-53-40-300x225.png)](/uploads/2011/05/Windows-XP-Professional-2011-05-23-01-53-40.png)

（图2）

（吐槽：好久没写这么长的文章，写的我都崩溃了。说到写文章，我发现现在我如果拿起笔去写字，经常会发生提笔忘字的情况！！！天啊！！！）
