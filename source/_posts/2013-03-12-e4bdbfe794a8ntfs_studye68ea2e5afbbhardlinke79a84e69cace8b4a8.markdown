---
author: admin
comments: true
date: 2013-03-12 13:26:45+00:00
layout: post
slug: '%e4%bd%bf%e7%94%a8ntfs_study%e6%8e%a2%e5%af%bbhardlink%e7%9a%84%e6%9c%ac%e8%b4%a8'
title: 使用ntfs_study探寻hardlink的本质
wordpress_id: 179
categories:
- NTInternals
---

在推出[ntfs_study的博文](http://0cch.net/wordpress/?p=117)中，我谈到过要用一些例子来简单介绍这个工具的用法，本文就算是这个工具的使用介绍以及hardlink在ntfs文件系统底层的简单探讨。

MSDN中写到，hardlink是在文件系统中，用多个在同一个卷的路径表示同一个文件的方法。那么在ntfs格式中这些被link的文件是怎么存在的呢？下面进行一些简单的探讨。

首先，我们需要去创建hardlink的文件。  
[![20130312202150](/uploads/2013/03/20130312202150.png)](/uploads/2013/03/20130312202150.png)

图中，第一个命令，在target_file.txt的同目录下，创建了hardlink文件link_file.txt。第二个命令，在不同目录（otherdir）下创建了第二个hardlink文件，link_file_in_otherdir.txt。第三个命令返回了错误，原因是我试图在不同卷里面来创建hardlink文件。失败的原因文章后面会介绍。

现在，让我们用ntfs_study来查看ntfs对这三个文件的处理到底是怎么样的。  
[![20130312202324](/uploads/2013/03/20130312202324.png)](/uploads/2013/03/20130312202324.png)

在这张图中，我们可以清楚的看到，这三个文件的file reference，也就是在主文件表（MFT）的id都是一样的！有一点我们必须明白，一个文件的存在不是因为在目录里面显示了文件名，而是他在MFT中有自己的位置，另外文件名只是文件的一个属性而已，没什么特别的。这也就解释了，看似三个文件为什么会指向同一个文件，因为在目录的记录中，他们指向了同一个id。

为了更加深入的探讨这个问题，我们来看一看id为0xB4A6这个具体情况。首先看看他的file record的数据。

[![20130312202509](/uploads/2013/03/20130312202509.png)](/uploads/2013/03/20130312202509.png)



这里可以看到hardlinks的值是4！看到这里，应该就感到奇怪了，我们明明只创建了两个hardlink的文件，为什么这里写的是4呢？实际上，对于ntfs的文件而已，文件名以及他们在那个目录，这些都是属性而已，没有本体和hardlink之分，也就是说，我们原始创建的target_file.txt对于文件本身，也是一个hardlink。那么这个问题还是没解决啊，就算加上本身，最多也就是3个hardlinks，但是这里明明写的是4个！

让我们更加具体的看一看到底是什么回事吧。

[![20130312202536](/uploads/2013/03/20130312202536.png)](/uploads/2013/03/20130312202536.png)

首先，我们看到了这个文件的属性中，居然有4个文件名，其中有三个实际上我们已经能够猜到，他们应该分别是target_file，link_file和link_file_in_otherdir这三个名称，那么第四个又是什么呢？只能再进一步看了。

[![20130312202616](/uploads/2013/03/20130312202616.png)](/uploads/2013/03/20130312202616.png)


看了这幅图，估计大家就明白了，这个是为了兼容8.3文件名而产生的一个hardlink，只不过在我们现在的系统上隐藏了这个文件hardlink而已。其他三个文件名，如我们刚刚所料，就是那三个文件的名字。

现在解释下为什么hardlink只能在同一个卷里了。原因很显而易见，hardlink实际上是依赖于ntfs的MFT的，而不同的卷，会有不同的MFT，所以不能在不同卷之间创建hardlink也是理所当然的。

SysinternalsSuite中有一个工具叫做findlinks，用来找到一个文件所有的hardlink。其中实现的方法在不同的系统中有所不同，在vista以下的系统中程序调用GetFileInformationByHandle获得文件的MFT id，然后查找整个卷的文件，打开他们获得句柄，再调用GetFileInformationByHandle得到这些文件的id，与之前的id进行比对。可以说，这是非常费时的。而在vista中，这个耗时的问题得到了解决，调用FindFirstFileNameW和FindNextFileNameW就能够文件所有的hardlinks了。

我也计划过两天写一个find_links_study。




