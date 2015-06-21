---
author: admin
comments: true
date: 2013-06-12 17:55:03+00:00
layout: post
slug: etwlogview-%e5%ae%9e%e6%97%b6%e6%9f%a5%e7%9c%8betw%e7%9a%84%e5%b7%a5%e5%85%b7
title: EtwLogView —— 实时查看ETW的工具
wordpress_id: 265
categories:
- Debugging
---

最近玩XPerf玩的比较多，也经常和cradiator([blog](http://sysdbg.com))讨论xperf和etw的话题。上周吃饭的时候就讨论到，貌似没找到一款实时记录查看etw的工具。当时我的观点是，只是看etw的原始记录很难分析出什么东西，必须配合很细工具，例如xperfview。这样才能有效的发挥出etw的威力，所以实时工具用处不大。而cradiator认为，除了这些常规的用法外，如果能实时记录查看etw的信息，那么把etw当作平时的log输出方式也是不错的选择。这样的好处就是，不需要额外的加入log机制，使用etw就足够强大，其次如果遇上了问题，这些etw的记录又可以作为event，帮助xperfview的分析。然后这家伙就怂恿我写一个:-)

经过上面的一番介绍，应该就能知道EtwLogView的用处何在了。他是一个“实时”记录查看etw的工具。之所以用上了引号。是因为这个实时是有不确定性的。例如，如果一个provider输出了大量的事件信息。那么这个工具就会遇上麻烦，因为更新记录，和刷新界面的速度很可能跟不上provider的输出速度。这样，这个实时就大打折扣。不过就像cradiator所说的，只用来监控自己的事件，倒没什么问题。

现在EtwLogView是1.0版本，勉强算是可以先用着吧。

首先需要在Windows7系统和管理员权限运行工具，然后就可以创建Session，创建的时候需要选择Session的Provider。可以在List选择，也可以自己输入（必须为GUID格式）。如果想监视多个Provider，那么每个GUID之间需要用分号隔开。



[![20130613010933](/uploads/2013/06/20130613010933.png)](/uploads/2013/06/20130613010933.png)



[![20130613011032](/uploads/2013/06/20130613011032.png)](/uploads/2013/06/20130613011032.png)



另外，如果想更灵活的设置Session，可以使用xperf创建Session。然后打开EtwLogView，选择打开Session。在文本框中输入Session名，如果有多个Session需要监视，那么可以用分号隔开Session名。

[![20130613011054](/uploads/2013/06/20130613011054.png)](/uploads/2013/06/20130613011054.png)

ETW输出的信息很多，我主要列出了12列，并且可以根据自己的需要选择显示的列。

[![20130613011110](/uploads/2013/06/20130613011110.png)](/uploads/2013/06/20130613011110.png)



目前的功能就这么多，如果真的有的上再来看看能加上哪些功能吧。

下载[EtwLogView](/uploads/2013/06/EtwLogView.zip)
