---
author: admin
comments: true
layout: post
slug: 'Optimization details in QMutex'
title: QMutex中的优化小细节
date: 2021-09-12 19:46:53
categories:
- CPP
---

在这篇文章中，我们要讨论的并不是`QMutex`的原理或者是应该如何使用，而是`QMutex`中一个很少被提到的优化细节。

我们知道在QT中，`QMutex`通常会和`QMutexLocker`一起使用，主要的用途是保护一个对象、数据结构或代码段，以便一次只让一个线程可以访问它们。 这一点对于多线程程序来说非常重要，而如今的程序已经离不开多线程，所以`QMutex`的使用场景也是越来越多，为了提高`QMutex`的使用效率，QT在`QMutex`的实现上加入了一个优化细节，这是`std::mutex`没有的，让我们来看看这个优化具体是什么。

`QMutex`的基类`QBasicMutex`有一个类型为`QBasicAtomicPointer<QMutexData>`成员，这里可以先忽略`QBasicAtomicPointer`，它只是保证对指针的原子操作，正在发挥作用的是`QMutexData*`。`QMutexData`类型也没有什么特殊之处，真正的优化是在它的派生类`QMutexPrivate`，来看一段`QMutexPrivate`的代码：

``` c++
class QMutexPrivate : public QMutexData
{
    ...
    void deref() {
        if (!refCount.deref())
            release();
    }
    void release();
    ...
};

void QMutexPrivate::release()
{
    freelist()->release(id);
}
```

可以看到，当引用计数为0的时候调用的`release`函数并没有真正释放互斥体对象，而是调用了一个`freelist`的`release`函数。追踪`freelist()`会发现这样一段代码：

``` c++
namespace {
struct FreeListConstants : QFreeListDefaultConstants {
    enum { BlockCount = 4, MaxIndex=0xffff };
    static const int Sizes[BlockCount];
};
const int FreeListConstants::Sizes[FreeListConstants::BlockCount] = {
    16,
    128,
    1024,
    FreeListConstants::MaxIndex - (16 + 128 + 1024)
};

typedef QFreeList<QMutexPrivate, FreeListConstants> FreeList;

static FreeList freeList_;
FreeList *freelist()
{
    return &freeList_;
}
}
```

这下就豁然开朗了，`QFreeList`可以被认为是缓存池，用于维护`QMutexPrivate`的内存，当`QMutexPrivate`调用`release`函数的时候，QT并不会真的释放对象，而是将其加入到缓存池中，以便后续代码申请使用。这样不但可以减少内存反复分配带来的开销，也可以减少反复分配内核对象代码的开销，对于程序的性能是有所帮助的。

具体`QFreeList`的实现并不复杂，大家可以参考QT中的源代码`qtbase\src\corelib\tools\qfreelist_p.h`，另外除了`QMutex`以外，`QRecursiveMutex`和`QReadWriteLock`也用到了相同的技术。