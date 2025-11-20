def is_wikimedia(url: str) -> bool:
    return "commons.wikimedia.org" in url or "upload.wikimedia.org" in url

url = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/23456789.jpg?k=0a80570991770704888090909090909090909090909090909090909090909090&o=&hp=1"
print(f"Is wikimedia: {is_wikimedia(url)}")
