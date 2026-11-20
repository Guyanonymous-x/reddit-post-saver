# Reddit Post Saver

A small Chrome extension: in any subreddit, one click saves the title and text of
every post you can see, pages down, and repeats 25 times, then downloads it all as
a CSV file.

## Install (once)
1. Download this repository (green **Code** button > **Download ZIP**) and unzip it.
2. In Chrome, go to `chrome://extensions`
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json` in it).

## Use
1. Open a subreddit, for example `https://www.reddit.com/r/pics/`.
2. Click the orange **Save posts** button (bottom right).
3. It saves the posts on screen, pages down, saves again, 25 times (about 50 seconds).
   Click the button again to stop early; it still saves what it has.
4. The CSV lands in your Downloads folder: `reddit_r-<subreddit>_<date>_<time>.csv`.

## The CSV
One row per post: Order, Page down (0 = the starting screen), Subreddit, Title,
Post text (the text Reddit shows for the post in the list; empty for picture and
link posts), Flair, Post type, Author, Score, Comments, Posted, Post link, Outside link, Post ID.
A post that is still on screen after a page down is saved only once.

Works on new Reddit (www.reddit.com) and old Reddit (old.reddit.com; there,
post text only shows if you opened the post's text preview).

## Change the settings
At the top of `content.js`: `PAGE_DOWNS` (25) and `WAIT_MS` (2000 = 2 seconds of
waiting for new posts after each page down). After changing, click the reload
arrow on the extension in `chrome://extensions`.
