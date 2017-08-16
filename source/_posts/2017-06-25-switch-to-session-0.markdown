---
author: admin
comments: true
date: 2017-06-25 21:48:24+00:00
layout: post
slug: 'switch-to-session-0'
title: 切换到session 0
categories:
- Tips
---

这是一个小技巧，可以帮助我们从session 1切换到session 0，并且获得system权限。有了system权限，可以做一些admin做不了的事情，具体哪些事情大伙可以自己挖掘。

```
切换到session 0：    rundll32 winsta.dll WinStationSwitchToServicesSession
切换会原session：    rundll32 winsta.dll WinStationRevertFromServicesSession
```

但是如果直接切换到session 0，会发现一个问题，我们没有桌面程序，所以什么事情也做不了。解决方法也很简单，创建一个explorer就可以了。但是普通方法创建explorer，怎么会不能创建到session 0，于是这里可想而知，我们需要一个服务来创建explorer。专门写一个服务程序未免太麻烦，这里可以使用cmd来快速创建explorer。

```
sc create desktop0 binpath= "cmd /c start explorer.exe" type= own type= interact
net start desktop0
```

虽然cmd不是服务，但是也会被运行起来，只不过不能与服务管理器交互，所以在超时的时候会被结束。不过那个时候已经没关系了，因为explorer已经创建起来了。接下来就可以切换了session 0，用system权限管理电脑了。