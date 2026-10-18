# Moonlit Start Page

A calm Chrome start page: a to-do list with a progress bar on the left, and your apps on the right. Tasks and apps are saved in your browser (localStorage).

## Use it as your Chrome New Tab (recommended)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Open a new tab

## Host it on GitHub Pages

1. Create a new repository on GitHub and push this folder to it
2. In the repo, go to **Settings → Pages**, set the source to the `main` branch, root folder
3. Your page will be live at `https://<your-username>.github.io/<repo-name>/`
4. In Chrome: **Settings → On startup → Open a specific page** and paste that URL

## Customise the apps

Click **+ Add** in the Quick Launch panel, paste a website and press Enter to add it. Hover over an app and click **×** to remove it. Icons are fetched automatically. The starting set lives in `DEFAULT_APPS` in `script.js`.

## AI story of the day

Below the to-do list is one free-to-read AI article per day: the most upvoted AI story on Hacker News from the past 7 days, skipping paywalled sites and anything you've already been shown. No API key or account needed.

## The glider

Move your mouse and the glider from the painting chases your cursor. Tune its feel with `TRAIL`, `MAX_SPEED` and `MAX_TURN` in `script.js`.

## Credits

Background art by its original artist (Avatar: The Last Airbender fan art, via moewalls.com).
