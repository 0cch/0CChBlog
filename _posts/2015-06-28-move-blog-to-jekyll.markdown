---
author: admin
comments: true
date: 2015-06-28 22:29:37+00:00
layout: post
slug: 'move-blog-to-jekyll'
title: 将blog迁移到了jekyll
categories:
- Tips
---

上周终于下定决心把blog从[wordpress](http://0cch.net)转到[jekyll](http://0cch.com)，不是因为wordpress臃肿，也不是因为jekyll的更加Geek，纯粹是因为穷。我一直都觉得wordpress是一个非常伟大的blog程序，虽然臃肿了点，但确实功能强大操作简单，对于我这种懒人和对前端代码完全不熟的程序员来说，wordpress确实是一个非常好的选择。但是问题就出在了webhost上，我使用的webhost刚刚买的时候是50多刀一年，之后每年涨价，今年续费看了下需要100刀左右，这个确实让我心中无数的羊驼奔腾了起来。于是就决定把blog搬离这个地方。

刚开始我只是想找便宜的地方转移wordpress的blog。网上也有很多这类的webhost，第一年进去都很便宜，甚至有1刀一个月的。但是一朝被蛇咬啊，为了防止以后又被迫搬家，于是打消了这个念头。想要便宜和稳定的blog空间，看来是只有伟大的Github。而Github只支持静态程序，那么我也只能放弃wordpress的方便，自己折腾点静态博客程序了。摆在眼前的选择其实很多最基础jekyll，加强版的octopress以及hexo。第一个程序的优点就是简单基础，缺点就是太基础了，而octopress在jekyll的基础之上加上了一些插件，让blog默认的功能变得丰富起来。之后hexo，也是一个自带很多基础功能的程序而且还带了很多非常漂亮的主题，主题控的bloger不妨选择这个，我就特别喜欢他其中的一个默认主题，但是折腾样式的时候jekyll的基本结构都搭建好了，所以就没有更换hexo程序，于是极度痛苦的折腾了一周的css和ruby插件才把现在的blog折腾的和之前的差不多。

简单说下用jekyll在Github上搭建blog的步骤，其实网上很多很多教程，这里记录下就是防止自己忘了把。  
1. 首先在[http://rubyinstaller.org/downloads/](http://rubyinstaller.org/downloads/)下载ruby和DevKit，安装分别安装他们，然后运行Devkit，分别执行：    
	1) dk.rb init  
	2) dk.rb review  
	3) dk.rb install  
2. 接下来就是安装jekyll了，安装之前推荐更换Gem的源到https://ruby.taobao.org/ 这样下载程序比较快。具体方式是：  
	1) gem source -r (url)  
	2) gem source -a (new url)  
	3) gem source -u  
3. 然后就可以开始下载jekyll和他的代码高亮程序rouge了，gem install (app name)  
4. 最后记得要设置_config.yml文件，尤其是高亮highlighter: rouge

这样，最基础功能的blog就搭建好了，接下来就是把blog从wordpress转移到jekyll了。方法是使用exitwp这个python脚本。  
1. 先导出wordpress的数据到一个xml里，这个功能wordpress是自带的。  
2. 然后同个这个脚本把数据转换成markdown文件，放在jekyll生产的_post里面。并且把里面的图片和下载的url替换了。  
3. 最后把wordpress的upload目录下载下来，放到jekyll里面即可。

这样我们看到的就是一个最简单的jekyll的blog，要想改变主题，自己去折腾吧。我能做的就是推荐两个jekyll的插件，分别是按日期和分类生成归档网页的，可以在我的[Github](https://github.com/0cch/0CChBlog/tree/master/_plugins)上看到。

最后要说的是rouge语法高亮有个bug，在使用显示行号linenos参数的时候会出现嵌套错误的问题，解决方法倒是有，不过有了行号之后高亮的显示极其丑陋，所以还是我还是没用这个参数。如果有需求可以使用代码[rouge_linenos_patch.rb](https://gist.github.com/0cch/775e4a8a94be175cae9c)覆盖"\\lib\ruby\gems\2.2.0\gems\jekyll-2.5.3\lib\jekyll\tags\highlight.rb"里对应的函数即可。

{% gist 0cch/775e4a8a94be175cae9c rouge_linenos_patch.rb %}