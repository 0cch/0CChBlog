---
author: admin
comments: true
layout: post
slug: 'reverse-ssh'
title: ssh的反向连接
date: 2018-01-20 16:53:39
categories:
- Tips
---

家里有个树莓派，基本上用来当了一个微型服务器，24小时跑着。主要用途是在我不在家的时候控制家里网络，充分利用带宽。一直以来，我都是用树莓派把IP更新到DDNS（家里是外网IP），并且在路由器上做端口映射。这样就能在其他地方访问树莓派了。但是不知为何，这段时间无法从外网ping通家里（后来发现是光猫问题，换了个猫就好了），从外围直接联通家里的树莓派这条路被封了，所以就折腾了SSH的反向连接功能。用这个方法也可以克服家里是内网IP的情况，当然前提是我们在外网有一台服务器或者vps。原理上和其他的反向连接是一样的，这里就不讨论原理了，直接介绍方法。

```
# ssh -fCNR remote_port:localhost:local_port user@remote_addr
```

```
-f 后台执行ssh指令
-C 允许压缩数据
-N 不执行远程指令
-R 将远程主机(服务器)的某个端口转发到本地端指定机器的指定端口
```

这条命令的意思是：请将remote_addr机器里对remote_port的连接转发到本地机器的本地端口。举个例子，假设我有一台内网机器A，其ssh端口为6622，另外有一台VPS，地址是VPS_ADDR.com，SSH端口是8822。这个时候我想通过VPS的9922端口去访问树莓派的SSH。那么我需要用命令：

```
# ssh -fCNR 9922:localhost:6622 user@VPS_ADDR.com
```

当完成了这个命令后，我们就可以在VPS上登陆树莓派了：

```
# ssh -p 9922 pi@localhost
```

解决了这个问题后，我们需要解决另外一个问题。我们每次输入反向连接的命令的时候总需要输入VPS密码，这个非常不利于我们把命令设置为开机启动。为了解决这个问题，首先想到的是sshpass。这个工具可以帮助我们自动输入密码，命令如下：

```
# sshpass -p your_VPS_password ssh -fCNR 9922:localhost:6622 user@VPS_ADDR.com
```

把命令放到树莓派的开机启动命令后，重启树莓派，成功从VPS连入了树莓派。不过第二天，我又发现了另外一个问题，SSH的反向连接在无人访问的时候会超时，超时后会断开链接。这样明显不符合我想连就连的需求。于是就得上autossh这个工具了，这个工具会守护ssh，让ssh的反向连接保持联通。但是autossh不支持自动输入密码，网上很多解决办法是用证书的方式省去了输入密码的过程，不过我这里提供另外一个方法，使用expect工具。

```
# expect -c "
spawn autossh -M 11122 -CNR 9922:localhost:6622 user@VPS_ADDR.com -o StrictHostKeyChecking=no
expect \"Password:\"
send \"your_password\r\"
expect eof
"
```

这个工具可以自动和ssh进行交互，当VPS提示Password:的时候，我们send密码过去就行了，注意使用StrictHostKeyChecking=no来避免Host key的验证提示。把这个命令放在开机启动的时候执行，完美解决了外网访问家里树莓派的问题。

