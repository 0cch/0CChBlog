---
author: admin
comments: true
layout: post
slug: 'qt event windbg script'
title: windbg监听QT事件
date: 2019-05-29 14:18:58
categories:
- Tips
---

Windows平台下做过界面开发的程序员肯定知道窗口界面是由消息驱动的。为了能方便的调试窗口消息循环，Windows提供了spy++这样的工具帮助我们监控消息。但是Windows的消息在QT的程序上可能只有部分有用。所以我们还需要一个监控QT窗口事件的工具，不过可惜的是我并没有找到这样现成的工具。于是我用Windbg的断点命令写了一个。

不过写断点命令之前必须先搞清楚在QT中事件都是怎么发出来的。经过调试确认了几个函数，分别是：

``` c++
QCoreApplication::sendEvent
QCoreApplication::sendSpontaneousEvent
QCoreApplication::postEvent
```

接下来我们可以对它们下断点了。当然，这里不是直接了当下断点那么的简单。我们需要在断点中插入命令，让断点命中后打印我们想要的内容，然后继续运行。我这里的写法是：

``` 
bm /( qtcored4!QCoreApplication::postEvent ".printf \"P  \";?? @@C++(static_cast<QtGuid4!QEvent::Type>(event->t));g"
bc 2
bm /( qtcored4!QCoreApplication::sendEvent ".printf \"S  \";?? @@C++(static_cast<QtGuid4!QEvent::Type>(event->t));g"
bm /( qtcored4!QCoreApplication::sendSpontaneousEvent ".printf \"SS \";?? @@C++(static_cast<QtGuid4!QEvent::Type>(event->t));g"
```

在windbg中执行后，运行程序就能看到事件一个一个的打印出来了，而且打印出来的并不是冷冰冰的事件数字，而是数字所代表的含义：

```
SS QEvent::Type WindowDeactivate (0n25)
P  QEvent::Type UpdateRequest (0n77)
S  QEvent::Type WindowDeactivate (0n25)
S  QEvent::Type WindowDeactivate (0n25)
SS QEvent::Type ActivationChange (0n99)
SS QEvent::Type ApplicationDeactivate (0n122)
S  QEvent::Type UpdateRequest (0n77)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type ApplicationActivate (0n121)
SS QEvent::Type WindowActivate (0n24)
P  QEvent::Type UpdateRequest (0n77)
S  QEvent::Type WindowActivate (0n24)
S  QEvent::Type WindowActivate (0n24)
S  QEvent::Type WindowActivate (0n24)
SS QEvent::Type ActivationChange (0n99)
S  QEvent::Type UpdateRequest (0n77)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type Paint (0n12)
SS QEvent::Type NonClientAreaMouseMove (0n173)
S  QEvent::Type Enter (0n10)
S  QEvent::Type Enter (0n10)
SS QEvent::Type MouseMove (0n5)
S  QEvent::Type Leave (0n11)
S  QEvent::Type Enter (0n10)
SS QEvent::Type MouseMove (0n5)
SS QEvent::Type MouseMove (0n5)
SS QEvent::Type MouseMove (0n5)
SS QEvent::Type MouseMove (0n5)
SS QEvent::Type MouseMove (0n5)
SS QEvent::Type MouseMove (0n5)
S  QEvent::Type Leave (0n11)
S  QEvent::Type Leave (0n11)
SS QEvent::Type WindowDeactivate (0n25)
P  QEvent::Type UpdateRequest (0n77)
S  QEvent::Type WindowDeactivate (0n25)
S  QEvent::Type WindowDeactivate (0n25)
S  QEvent::Type WindowDeactivate (0n25)
SS QEvent::Type ActivationChange (0n99)
SS QEvent::Type ApplicationDeactivate (0n122)
S  QEvent::Type UpdateRequest (0n77)
```



