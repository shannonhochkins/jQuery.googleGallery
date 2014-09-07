jQuery.googleGallery
====================

A gallery, Similar to the google images search interface. Created by [shannon hochkins].
[shannon hochkins]: http://www.shannonhochkins.com/


Usage
--------------

```javascript
$('.element').googleGallery({
    minHeight: 500,
    speed: 350,
    easing: 'ease',
    automaticallyGetHTML: true,
    childrenSelector: 'div',
    onItemClick: null
});
```


Options
--------------


| Options                   | Default                             | Description  |
| --------------------------|:-----------------------------------:| ------------:|
| minHeight                 | 500                                 | The minimum height of the expanded gallery section |
| speed                     | 350                                 | The speed of animation when the gallery opens. |
| easing                    | 'ease'                              | The animation ease type. |
| automaticallyGetHTML      | true                                | Disable the default fill option, allowing you to fill the html with the callbacks provided. |
| childrenSelector          | 'div'                               | The pugin will gather or bind the events to the immediate children of the element you're running the plugin on. |
| onItemClick               | null                                | Callback function once an item is clicked, the whole plugin is passed to this function, see example below.



**Example - Default**
====================

HTML
--------------

```html
<ul class="gallery">
    <li><a href="/" data-get-content-from="#content1"><img src="/path/to/image.jpg" /></a></li>
    <li><a href="/" data-get-content-from=".content2"><img src="/path/to/image.jpg" /></a></li>
    <li><a href="/" data-get-content-from="[href='content3']"><img src="/path/to/image.jpg" /></a></li>
    <li><a href="/" data-get-content-from="[class^='content4']"><img src="/path/to/image.jpg" /></a></li>
    <li><a href="/" data-get-content-from=".content5"><img src="/path/to/image.jpg" /></a></li>
</ul>
```

JAVASCRIPT
--------------

```javascript
$('.gallery').googleGallery({
    childrenSelector: 'li'    
});
```

###### The above will automatically fill the expanded section with the html from the selectors provided in the *data-get-content-from* html attribute.


**Example - Advanced**
====================


HTML
--------------

```html
<div class="galleryAdvanced">
    <div><a href="/" title="item1"><img src="/path/to/image.jpg" /></a></div>
    <div><a href="/" title="item2"><img src="/path/to/image.jpg" /></a></div>
    <div><a href="/" title="item3"><img src="/path/to/image.jpg" /></a></div>
    <div><a href="/" title="item4"><img src="/path/to/image.jpg" /></a></div>
    <div><a href="/" title="item5"><img src="/path/to/image.jpg" /></a></div>
</div>
```

JAVASCRIPT
--------------

```javascript
$('.galleryAdvanced').googleGallery({
    childrenSelector: 'div',
    automaticallyGetHTML: false,
    onItemClick: function(item){
        var plugin = this;
        var innerContainer = plugin.$previewInner;
        innerContainer.html('This is the new html for:' + item.attr('title') + '. This items index is: ' + plugin.self.current);
    }
});
```

###### This allows you to write your own html fill method for the preview container.



