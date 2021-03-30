---
author: admin
comments: true
layout: post
slug: 'Qt Implicit Sharing and Copy-On-Write'
title: Qt的隐式共享和写时拷贝
date: 2021-07-11 18:18:12
categories:
- CPP
---

不得不说Qt为了提高代码的运行效率做了很多伟大的工作，引入隐式共享和写时拷贝技术就是其中之一。该技术十分值得我们学习，一方面是因为它也可以运用到我们的代码中提高代码的运行效率，另一方面我们在理解其原理之后才能够更加高效的使用Qt。

Qt中的隐式共享是指类中存在一个共享数据块指针，改数据块由数据和引用技术组成。

* 当类型对象被创建时，共享数据块也被创建，并且设置引用技术为1。
* 当类型对象发生拷贝时，共享数据块共享其指针，并且递增引用计数（+1）。
* 当类型对象销毁时，共享数据块引用技术递减（-1），当引用计数归零时销毁数据块。
* 当类型对象调用方法有可能被修改时，采用写时拷贝机制，创建真正对象副本。

使用隐式共享和写时拷贝的好处非常明显，在只读的情况下，拷贝对象的内存和CPU计算成本非常低。只有在真正修改对象的时候，才会发生对象拷贝。除了Qt中的普通类型以外，Qt的容器类型也大量采用了这种技术，这也是Qt容器和STL容器的一个显著的区别。

来看一个简单的例子：

``` c++
// class QPenPrivate *d

QPen::QPen(const QPen &p) noexcept
{
    d = p.d;
    if (d)
        d->ref.ref();
}

QPen::~QPen()
{
    if (d && !d->ref.deref())
        delete d;
}

void QPen::detach()
{
    if (d->ref.loadRelaxed() == 1)
        return;

    QPenData *x = new QPenData(*static_cast<QPenData *>(d));
    if (!d->ref.deref())
        delete d;
    x->ref.storeRelaxed(1);
    d = x;
}

void QPen::setStyle(Qt::PenStyle s)
{
    if (d->style == s)
        return;
    detach();
    d->style = s;
    QPenData *dd = static_cast<QPenData *>(d);
    dd->dashPattern.clear();
    dd->dashOffset = 0;
}
```

可以看到`Pen`的拷贝构造函数只是将共享数据块指针从`p`赋值到当前对象，然后增加其引用计数。当对象析构时，首先减少引用计数，然后判断引用计数是否归零，如果条件成立则释放对象。当调用`setStyle`函数修改对象的时候，函数调用了一个`detach`函数，这个`detach`函数检查当前的引用计数，若引用计数为1，证明没有共享数据块，可以直接修改数据。反之引用计数不为1，则证明存在共享改数据块的类，无法直接修改数据，需要拷贝一份新的数据。

现在看来，Qt似乎已经为我们考虑的十分周到了，不调用修改对象的函数是不会发生真正的拷贝的。那么需要我们做什么呢？答案是，Qt的使用者应该尽可能的避免误操作导致的数据拷贝。前面提到过，Qt认为可能发生写对象的操作都会真实的拷贝对象，其中要给典型的情况是：

``` c++
QVector<int> test1{ 1,2,3 };
QVector<int> test2 = test1;
int* p = test2.data();
```

这里看起来并没有发生对象的写操作，但是数据拷贝还是发生了，因为Qt认为这是一个可能发生写数据的操作，所以在调用`data()`的时候就调用了`detach()`函数。

``` c++
inline T *data() { detach(); return d->begin(); }
```

如果确定不会修改对象的数据应该明确告知编译器：

``` c++
QVector<int> test1{ 1,2,3 };
const QVector<int> test2 = test1;
QVector<int> test3 = test1;
const int* p = test2.data();
const int* q = test3.constData();
```

其中

``` c++
inline const T *data() const { return d->begin(); }
inline const T *constData() const { return d->begin(); }
```

它们都不会调用`detach`函数拷贝对象。还是C++编程老生常谈那句话：在确定不修改对象的时候总是使用`const`来声明它，以便编译器对其做优化处理。

有时候我们并不是完全弄清楚编程环境中具体发生了什么，比如你可能不知道Qt的隐式共享和写时拷贝，但是保持良好的编程习惯，比如对于不修改的对象声明为`const`，有时候可以在不经意间优化了编写的代码，何乐而不为呢。

值得注意的是，我们应该尽量避免直接引用并通过引用修改Qt容器中的对象。千万不要这么做，因为可能会得到你不想看到的结果，例如：

``` c++
QVector<int> test1{ 1,2,3 };
QVector<int> test2 = test1;
int& v = test1[1];
v = 20;
```

这份代码不会出现问题，因为当表达式`test2 = test1`运行时，共享数据的引用计数递增为2，当调用`operator []`的时候由于`test1`不是`const`，所以会为`test1`拷贝一份副本。最后结果是：

``` c++
test1[1] == 20;
test2[1] == 2;
```

这样看来没有问题，但不幸的是我们有时候也会这样写：

``` c++
QVector<int> test1{ 1,2,3 };
int& v = test1[1];
QVector<int> test2 = test1;
v = 20;
```

上面这份代码会带来一个意想不到的结果：

``` c++
test1[1] == 20;
test2[1] == 20;
```

因为在运行`int& v = test1[1];`这句代码的时候，数据块的引用计数为1，`detach`函数认为数据块没有共享，所以无需拷贝数据。当执行`test2 = test1`的时候，Qt并不知道之前发生了什么，所以仅仅增加了引用计数，所以修改`v`同时修改了`test1`和`test2`。这不是我们想看到的结果，所以我们应该怎么做？注意代码执行的顺序么？得了吧，即使能保证自己会注意到代码的执行顺序问题，也不能保证其他人修改你的代码时会怎么做，最好的做法是告诉大家，我们的项目有一条规则——禁止直接引用并通过引用修改Qt容器中的对象！或者干脆，使用STL的容器吧。

最后，如果觉得Qt的隐式共享和写时拷贝技术很不错，碰巧你的项目的编写环境中也有Qt，那么使用`QSharedData`和`QSharedDataPointer`会让你的工作轻松很多。