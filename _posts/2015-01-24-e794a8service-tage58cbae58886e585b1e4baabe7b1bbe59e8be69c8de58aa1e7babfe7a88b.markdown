---
author: admin
comments: true
date: 2015-01-24 14:29:31+00:00
layout: post
slug: '%e7%94%a8service-tag%e5%8c%ba%e5%88%86%e5%85%b1%e4%ba%ab%e7%b1%bb%e5%9e%8b%e6%9c%8d%e5%8a%a1%e7%ba%bf%e7%a8%8b'
title: 用Service Tag区分共享类型服务线程
wordpress_id: 513
categories:
- Debugging
- Tips
---

Windows中有一种共享类型的服务，这种服务的特点是，他们可能同时有多个不同服务运行在同一个进程内。这些服务通常都是一些dll，他们被加载到宿主进程内运行，这个宿主进程我们见到最多的就是svchost了，如下图所示：
[![20150124220922](/uploads/2015/01/20150124220922.png)](/uploads/2015/01/20150124220922.png)

Windows这样做的好处就是尽可能的节约资源，当然不好地方就是，如果出了问题那么难以调试和定位。所以，为了更好的定位共享服务的工作线程，微软支持了一种叫做Service Tag的东西。Service Tag简单的说就是标注线程属于哪个服务的，这个是由Service Control Manager支持的。在TEB中有一个SubProcessTag字段，每当一个服务注册并且运行的时候，Service Control Manager会分配给服务线程一个id，这个id就是SubProcessTag，它能够唯一的表示服务，而且这个值是一直都被继承的，也就是说，如果服务线程再创建线程，那么新的线程的SubProcessTag也会被标记为父线程的id。当然，也有一种例外，那就是如果用了线程池，就不会继承SubProcessTag了。

在Advapi32.dll中有一个函数，叫做I_QueryTagInformation，这个函数可以根据SubProcessTag去查询Service的信息，有兴趣的同学可以看看下面的链接：[http://wj32.org/wp/2010/03/30/howto-use-i_querytaginformation/](http://wj32.org/wp/2010/03/30/howto-use-i_querytaginformation/)
