---
author: admin
comments: true
layout: post
slug: 'vs with qt4.natvis'
title: vs使用qt4.natvis
date: 2019-08-01 09:05:03
categories:
- Tips
---

上一篇blog讲到了windbg使用qt4.natvis解析qt数据结构的方法，那么接下来就该轮到VS了。在VS中使用natvis会更加简单，只需要将qt4.nativs拷贝到`%VSINSTALLDIR%\Common7\Packages\Debugger\Visualizers`即可。当然，这篇blog不可能只写这么点东西。qt4.natvis很好，它解析了很多QT的数据结构，比如QMap，QPoint，QVector，QMatrix等等，不过有一点很遗憾，它没有解析QObject。因为解析QObject可以获取对象的父子节点，这样很容易了解对象的树形结构。于是我这里对qt4.natvis进行了一点修改，添加了对QObject的解析：

``` xml
<Type Name="QObject">
	<DisplayString>{{{*(char **)(*(char **)(*(char **)this - 4) + 12) + 12,sb}}}</DisplayString>
	<Expand>
		<ExpandedItem>d_ptr.d->children</ExpandedItem>
	</Expand>
</Type>
```

解释一下这段xml，`<Type Name="QObject">"`是指定匹配的对象类型名，这里当然就是QObject了。
``` xml
<DisplayString>{{{*(char **)(*(char **)(*(char **)this - 4) + 12) + 12,sb}}}</DisplayString>
```
用于展示当前QObject的实际类型，也就是QObject的派生类名。这里采用的方法是获取虚表上的`RTTICompleteObjectLocator`对象指针，然后在获取`TypeDescriptor`。具体是怎么获取的那将是一篇长篇大论，这里就不展开了。最后`<ExpandedItem>d_ptr.d->children</ExpandedItem>`则是将其子对象展示出来，这样就能一目了然的指定其子对象的真实类型了。

![20190801183332](/uploads/2019/08/20190801183332.png)

从图中可以看到，除了str、str_list和str_map可以直接的看到数据之外，QMsgTest、QToolBar的子对象个数和类型也能一目了然。