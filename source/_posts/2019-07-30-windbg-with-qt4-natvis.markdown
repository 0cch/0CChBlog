---
author: admin
comments: true
layout: post
slug: 'windbg with qt4.natvis'
title: windbg使用qt4.natvis
date: 2019-07-30 18:59:11
categories:
- Tips
---

用windbg调试QT程序或者分析QT程序的dump是一件痛苦的事情，因为windbg缺少对QT基础数据的展示能力，比如：

``` c++
int main(int argc, char *argv[])
{
	QString str = "hello world";
	QList<QString> str_list;
	str_list.append(str);
	QMap<int, QString> str_map;
	str_map[11] = str;
}
```

这份代码使用windbg查看str，str_list或者str_map简直是一件折磨的事情。

```
0:000> dv
           argc = 0n1
           argv = 0x02cc5e00
            str = class QString
       str_list = class QList<QString>
        str_map = class QMap<int,QString>
              a = class QApplication
              w = class QMsgTest
0:000> dx str
str                 [Type: QString]
    [+0x000] d                : 0x2cc5d80 [Type: QString::Data *]
0:000> dx str_list
str_list                 [Type: QList<QString>]
    [+0x000] p                [Type: QListData]
    [+0x000] d                : 0x2cc7258 [Type: QListData::Data *]
0:000> dx str_map
str_map                 [Type: QMap<int,QString>]
    [+0x000] d                : 0x2cc72b8 [Type: QMapData *]
    [+0x000] e                : 0x2cc72b8 [Type: QMapData::Node *]
```

可以看到，windbg只会告诉你类型，根本不会给你展示数据本身，如果要查看数据还得自己来算，以最复杂的QMap为例：

```
0:000> ?? str_map.d->forward[0]
struct QMapData * 0x031470f8
   +0x000 backward         : 0x03147068 QMapData
   +0x004 forward          : [12] 0x03147068 QMapData
   +0x034 ref              : QBasicAtomicInt
   +0x038 topLevel         : 0n-17891602
   +0x03c size             : 0n-17891602
   +0x040 randomBits       : 0xfeeefeee
   +0x044 insertInOrder    : 0y0
   +0x044 sharable         : 0y1
   +0x044 strictAlignment  : 0y1
   +0x044 reserved         : 0y11111110111011101111111011101 (0x1fdddfdd)

0:000> ?? sizeof(@!"qtmsgtest!QMapPayloadNode<int,QString>")-sizeof(qtmsgtest!QMapData::Node*)
unsigned int 8

0:000> dt qtmsgtest!QMapNode<int,QString> (0x31470f8-8)
   +0x000 key              : 0n11
   +0x004 value            : QString
   +0x008 backward         : 0x03147068 QMapData::Node
   +0x00c forward          : [1] 0x03147068 QMapData::Node

0:000> ?? ((qtmsgtest!QString*)0x31470f4)->d
struct QString::Data * 0x03145b30
   +0x000 ref              : QBasicAtomicInt
   +0x004 alloc            : 0n11
   +0x008 size             : 0n11
   +0x00c data             : 0x03145b42  -> 0x68
   +0x010 clean            : 0y0
   +0x010 simpletext       : 0y0
   +0x010 righttoleft      : 0y0
   +0x010 asciiCache       : 0y0
   +0x010 capacity         : 0y0
   +0x010 reserved         : 0y11001101110 (0x66e)
   +0x012 array            : [1] 0x68

0:000> du @@C++(((qtmsgtest!QString*)0x31470f4)->d->data)
03145b42  "hello world"

```

你们看，为了获取key=11、value="hello world"需要这么折腾一通，如果数据多了那不得抓狂。

不过幸运了是windbg现在支持natvis了，简单的说就是通过natvis里的配置自动解析和符号匹配的数据结构。接下来要做的就是找一个好用的qt的natvis了。我这里找了一个qt配合vs2012里的qt4.natvis，让我们看看加载后的效果：

```
0:000> .nvload qt4.natvis
Successfully loaded visualizers in "C:\Program Files (x86)\Windows Kits\10\Debuggers\x86\Visualizers\qt4.natvis"
0:000> dv
           argc = 0n1
           argv = 0x02cc5e00
            str = hello world
       str_list = { size = 1 }
        str_map = { size = 1 }
              a = class QApplication
              w = class QMsgTest
0:000> dx str
str                 : hello world [Type: QString]
    [<Raw View>]     [Type: QString]
    [size]           : 11 [Type: int]
    [referenced]     : 3 [Type: long]
    [0]              : 0x68 [Type: unsigned short]
    [1]              : 0x65 [Type: unsigned short]
    [2]              : 0x6c [Type: unsigned short]
    [3]              : 0x6c [Type: unsigned short]
    [4]              : 0x6f [Type: unsigned short]
    [5]              : 0x20 [Type: unsigned short]
    [6]              : 0x77 [Type: unsigned short]
    [7]              : 0x6f [Type: unsigned short]
    [8]              : 0x72 [Type: unsigned short]
    [9]              : 0x6c [Type: unsigned short]
    [10]             : 0x64 [Type: unsigned short]
0:000> dx str_list
str_list                 : { size = 1 } [Type: QList<QString>]
    [<Raw View>]     [Type: QList<QString>]
    [referenced]     : 1 [Type: long]
    [0x0]            : hello world [Type: QString]
0:000> dx str_map
str_map                 : { size = 1 } [Type: QMap<int,QString>]
    [<Raw View>]     [Type: QMap<int,QString>]
    [referenced]     : 1 [Type: long]
    [0x0]            : 0x2cc7340 : (11, hello world) [Type: QMapNode<int,QString> *]
```

看到了么，无论是str，str_list还是str_map都直接打印出了内部的数据，无需大费周章的折腾，这简直是windbg爱好者调试qt程序的神器。

最后附上qt4.natvis的地址：[https://gist.github.com/gregseth/9bcd0112f8492fa7bfe7](https://gist.github.com/gregseth/9bcd0112f8492fa7bfe7)