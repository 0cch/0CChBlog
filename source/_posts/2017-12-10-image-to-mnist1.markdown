---
author: admin
comments: true
layout: post
slug: 'image-to-mnist1'
title: 将图片转化成mnist格式
date: 2017-12-09 20:51:42
categories:
- DeepLearner
---

利用mnist数据对数字符号进行识别基本上算是深度学习的Hello World了。在我学习这个“hello world”的过程中，多多少少有点不爽，原因是无论是训练数据还是测试数据，都是mnist准备好的，即使最后训练的数字识别率很高，我也没有什么参与感。其实，我特别想测试自己手写数字的识别率。
为了完成上述想法，我第一个想到的是将普通图片数据转换成mnist数据。mnist的数据格式非常简单，如下图所示：

[![2017-12-10-t10k-images.idx3-ubyte](/uploads/2017/12/2017-12-10-t10k-images.idx3-ubyte.png)](/uploads/2017/12/2017-12-10-t10k-images.idx3-ubyte.png)

[![2017-12-10-t10k-labels.idx1-ubyte](/uploads/2017/12/2017-12-10-t10k-labels.idx1-ubyte.png)](/uploads/2017/12/2017-12-10-t10k-labels.idx1-ubyte.png)

两幅图分别表示了图形数据和标签数据。他们都有一个4字节长度的magic number，用来识别数据的具体格式。如果是标签数据，那么格式相对简单，后续是一个标签数量，接着的是标签数据（0-9的值）。如果是图像数据，那么magic number后，出了4个字节的数据数量以外，还有分别占4字节的行列数据，最后的就是图像数据。结构非常简单，但是值得注意的事情有两点：
> 1. 数据使用big endian组织的。
> 2. 图像数据中，255表示前景，也就是黑色，0表示背景，也就是白色，这和我们平时看到的RGB是不同的。

知道了数据格式，接下来的事情就是用程序将图像转换到mnist了。说实在的，如果对于操作二进制的数据，C比python还是方便不少的。但是C读取图像更加麻烦。所以这里推荐还是使用python对数据做转化。

``` python
# 首先导入图像处理库
from PIL import Image
from array import *
# 接下来打开图片，并且将像转化为8bit黑白像素
im = Image.open(path_to_image)
im = im.convert('L')
# 转换图像到mnist的大小28*28
im = im.resize((28,28))
# 获取图像长宽
width, height = im.size()
# 将图像数据转化位mnist
for x in range(0,width):
	for y in range(0,height):
		data_image.append(255 - pixel[y,x])

# 将数据写到mnist文件中
header = array('B')
# 写入magic number
header.extend([0,0,8,3])
# 写入数据数量，以一个图片为例
header.extend([0,0,0,1])
# 写入行列像素数
header.extend([0,0,0,28])
header.extend([0,0,0,28])
# 写入数据
header.extend(data_image)
# 最后写文件
output_file = open(r'data.mnist', 'wb')
header.tofile(output_file)
output_file.close()
```
以上是对图像数据的转换，标签数据的转换代码和以上代码基本一样，所以这里不再赘述。
有了这个方法，我们可以通过画图软件画上一堆自己手写的数字，通过python批量转化成mnist格式的数据，再让tensorflow进行测试，算出模型对我们自己手写数字的识别正确率。

好了，以上就是我说的第一种让模型识别自己的手写数字的方法。不过，这个方法不能实时的识别我手写的数字，让人总觉得缺点什么。于是就有了第二种方法，这种方法将借助浏览器，js以及web server等工具将手写的数字实时的传给后台的模型进行识别，然后把结果回复给用户。不过这个方法就要等待下一篇文章来描述了。