---
author: admin
comments: true
layout: post
slug: 'tokenlinkedtoken tip'
title: 关于TokenLinkedToken的一点记录
date: 2018-08-24 20:14:23
categories:
- Tips
---

我们用GetTokenInformation可以获得一个TokenLinkedToken，简单的说就是要获得与我们进程token关联的token。  

接下来就有趣了，如果当你的进程是一个提权的管理员权限的进程，那么你获得的token会是一个标准用户进程的token，也就是一个提权之前进程。那么这有什么用呢？比如我们的子程序需要运行其他开发者开发的插件，而我们不想给予他们过高的权限，那么这个就有用了。当然，如果你更谨慎一些，你希望给予他更低的权限，那就得实用CreateRestrictedToken来创建一个新的token了。  

聪明的程序员看到这里肯定就会想，既然管理员权限下的进程获得的TokenLinkedToken是一个标准用户权限的token，那么标准用户权限环境下的进程能不能获得一个管理员权限的TokenLinkedToken呢？没错，答案是可以。更聪明的程序员肯定会惊讶，那这个不是安全漏洞么？答案是并不是，因为虽然可以获得一个管理员权限的token，但是这个token只是一个IDENTIFY level token，这是一个token的_SECURITY_IMPERSONATION_LEVEL，不同的模仿等级，对应于不同的功能。比如SecurityIdentification，这个等级就只能用来查询token的信息。比方说有外部一个进程访问我们的进程，我们可以让他提供token验证其身份。但是外部进程为了防止我们用他的token干坏事，所以只给我们一个IDENTIFY level token，这样一来，我们就只能验证身份而无法做其他事情了。  

我们真的没办法通过TokenLinkedToken获得可以使用的管理员身份的token了么？也不是，我们确实有办法获得能够使用的管理员身份的token。但是有个前提，我们的进程必须有SeTcbPrivilege权限。那这不也是个安全漏洞么？不是，因为SeTcbPrivilege是SYSTEM用户的权限，简单的说，这个用户的权限比管理员还要高。那这玩意不是也没什么用么？也有用，当你想在系统服务中启动一个管理员身份的进程的时候，可以先获得标准用户权限的token，然后获得其TokenLinkedToken，最后CreateProcessAsUser来创建进程。  

[![TokenLinkedToken](/uploads/2018/08/TokenLinkedToken.png)](/uploads/2018/08/TokenLinkedToken.png)