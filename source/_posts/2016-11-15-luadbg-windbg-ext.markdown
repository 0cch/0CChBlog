---
author: admin
comments: true
date: 2016-11-15 10:50:37+00:00
layout: post
slug: 'luadbg-windbg-ext'
title: windbg的lua脚本扩展luadbg
categories:
- Debugging
---

2012年的时候，我在blog上写到过开发了一个windbg的lua扩展[dbglua](/debugging/2012/08/16/dbglua-ef-bc-8c-e8-ae-a9lua-e8-84-9a-e6-9c-ac-e4-b9-9f-e8-83-bd-e6-8e-a7-e5-88-b6windbg-e8-bf-9b-e8-a1-8c-e8-b0-83-e8-af-95.html)，当时觉得windbg的原生脚本语法太奇怪了，而且太不容易使用。现在来看，依旧如此，只不过我已经很熟悉这个原生脚本了。而这个lua扩展反倒是没什么用，因为用起来也不太方便，比如访问结构体。

最近无意之中看了一眼pykd，他用重载.操作符的方式访问符号和结构体深深的吸引了我，感觉非常有趣。而python本身依赖比较多，这也促使我拿起之前的代码看了看，并且决定在github上重新建立这个项目叫做[luadbg](https://github.com/0cch/luadbg)，这次我决定长期维护这个项目，想到新的功能就往里面写，就像我一直维护的[0cchext](https://github.com/0cch/0cchext)一样。luadbg除了兼容了老dbglua的函数以外，还添加了几个我觉得很方便的类，主要是用重载.操作符的方式来访问模块和结构体的数据，效果如下图所示：

[![20161116113129](/uploads/2016/11/20161116113129.png)](/uploads/2016/11/20161116113129.png)


当然，也可以用!luacmd命令进入input模式，从而一条一条的输入语句来测试正确性。
