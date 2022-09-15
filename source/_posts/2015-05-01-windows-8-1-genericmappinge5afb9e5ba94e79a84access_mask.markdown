---
author: admin
comments: true
date: 2015-05-01 17:06:17+00:00
layout: post
slug: windows-8-1-genericmapping%e5%af%b9%e5%ba%94%e7%9a%84access_mask
title: Windows 8.1 GenericMapping对应的ACCESS_MASK
wordpress_id: 553
categories:
- Tips
---

我们在创建或者打开对象的时候需要指定ACCESS_MASK，有的时候为了方便，我们会在ACCESS_MASK的参数中填GenericRead,GenericWrite这样的值，那么对于这些对象来说，这些GenericXXX究竟是什么样的ACCESS_MASK都是保存在对象的GenericMapping中，以下就是Windows 8.1中所有对象的GenericMapping了。
[![20150502010045](/uploads/2015/05/20150502010045.png)](/uploads/2015/05/20150502010045.png)

将ACCESS_MASK数字转换成我们看得懂的宏，可以使用我写的一个小网页：
[http://0cch.com/accessmask.html](/accessmask.html)
