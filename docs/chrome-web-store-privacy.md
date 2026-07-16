# Chrome Web Store — Privacy practices answers

Ready-to-paste answers for the **Privacy practices** tab of the Chrome Web Store
Developer Dashboard when publishing **Broken Record** (issue #17). Derived from
the extension's actual behavior; see the hosted policy at `public/privacy.html`.

## Single purpose description

> Broken Record replaces the browser's new tab page with a single hand-picked
> album recommendation each day, styling the page after the album cover's colors.
> Its single purpose is to surface one daily album to listen to.

## Permission justifications

**`storage`**

> Used to persist one randomly-generated anonymous identifier in
> `chrome.storage.local`. This id seeds the daily album selection so the same
> pick stays stable across new tabs opened on the same day and rotates the next
> day. It is never transmitted off the device.

**Host permissions:** none declared. Cover images are displayed via ordinary
`<img>` tags (allowed under the default extension CSP); the extension makes no
programmatic cross-origin requests, so no host permissions are required.

**Remote code:** No — all scripts are bundled in the package. No remotely-hosted
code is loaded or executed.

## Data usage — collected data

**This item does not collect user data.** Under Chrome's definition, "collect"
means transmitting data off the device. Broken Record stores only an anonymous,
randomly-generated id locally (`chrome.storage.local`) that never leaves the
browser profile and is sent to no one. There is no analytics or tracking.

Leave every data-type checkbox (personally identifiable info, health, financial,
authentication, personal communications, location, web history, user activity,
website content) **unchecked**.

> Note: album cover images load from third-party CDNs (Apple/iTunes, Amazon)
> solely to display artwork. Those services receive standard request metadata
> (e.g. IP) inherent to loading any web image; the extension transmits no user
> data to them. This is image display, not data collection by the extension.

## Certifications (all true — check all three)

- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL

```
https://mwatt123.github.io/daily-music/privacy.html
```

Hosted from `public/privacy.html`, deployed by the existing GitHub Pages workflow
(`.github/workflows/deploy.yml`) on push to `main`. Confirm it resolves after the
next Pages deploy before submitting.
