# Third-party in-app notification services for Cadence

Research for [#6](https://github.com/CookieNess/cohort-005-project-fork/issues/6), part of map [#5](https://github.com/CookieNess/cohort-005-project-fork/issues/5) (in-app notifications to **Platform Admins**).

- Researched: 2026-11-11, from vendor docs, pricing pages and npm. Vendor docs are undated living pages; treat everything as "as of 2026-11-11".
- Package versions (from `npm view`, 2026-11-11): `@knocklabs/react` 0.15.1, `@knocklabs/node` 1.41.1, `@novu/react` 3.19.2, `@novu/api` 3.19.1, `@trycourier/courier-react` 9.3.5, `@trycourier/courier` 10.0.0, `@magicbell/react` 1.14.0, `magicbell-js` 1.8.0, `@suprsend/react` 1.5.0, `@suprsend/node-sdk` 1.15.1.
- **Uncertain** marks claims I could not fully confirm from a first-party page.

## What Cadence needs (from #5)

- Bell with unread count, dropdown list linking to pages, unread marking, "mark all as read".
- Toast (top-right) when a notification arrives, so real-time delivery.
- Server-side TypeScript trigger from React Router v7 actions/loaders.
- Free tier is enough. No EU residency or self-host needed.
- **Must run with no credentials** in dev and tests, like `app/lib/mailer.server.ts` falls back to `.outbox/`.

## Headline finding: nobody offers a credential-free mode

None of the five vendors documents a mock, offline, or test mode for in-app feeds. Knock's docs index lists no mocking or test-mode page ([llms.txt](https://docs.knock.app/llms.txt)); the others' docs likewise only describe hosted environments (dev/prod) that still need keys. Novu is the only one that can run fully locally, by self-hosting the MIT core ([repo](https://github.com/novuhq/novu)), which needs API, Worker, WS and Dashboard services plus MongoDB and Redis ([self-hosting](https://docs.novu.co/community/self-hosting-novu/overview)), too heavy for `npm run test`.

So whatever is chosen, Cadence must own the fallback, the same way it owns the Postmark one:

- **Server side:** a `NotificationTransport` interface (like `MailTransport`) with a vendor implementation and a local one (write to `.outbox/`-style files or a SQLite table) when no token is set.
- **Client side:** the vendor's React components need a live API. With no key, render Cadence's own bell/list/toast backed by the local store, or build on the vendor's **headless** hooks so only the data source swaps. This makes "how good is the headless layer" a real selection factor.

## Per-vendor findings

### Knock

- **React UI:** `@knocklabs/react` ships `NotificationIconButton` (bell with unread/unseen badge), `NotificationFeedPopover`, `NotificationFeed`, plus hooks for bring-your-own UI ([overview](https://docs.knock.app/in-app-ui/react/overview)). Pre-built and BYO components on all plans; Knock branding stays on Free ([pricing](https://knock.app/pricing)).
- **Real-time / toasts:** Feed updates over Knock's managed WebSocket service ([feeds overview](https://docs.knock.app/in-app-ui/feeds/overview)). No built-in toast component; the documented pattern is subscribing to `items.received.realtime` on the feed client and showing e.g. `react-hot-toast` ([toasts guide](https://docs.knock.app/in-app-ui/react/toasts)).
- **State:** Engagement statuses `seen`, `read`, `interacted`, `link_clicked`, `archived`, all per recipient message ([message statuses](https://docs.knock.app/send-notifications/message-statuses)). Message content cannot be changed; archive and retrigger instead ([feeds overview](https://docs.knock.app/in-app-ui/feeds/overview)).
- **Shared state across Platform Admins:** Not native, but the closest of the five. `POST /v1/channels/{channel_id}/messages/bulk/{action}` applies e.g. `archive` to all messages in a channel filtered by `trigger_data`, `workflows`, `recipient_ids`, etc. ([channels API](https://docs.knock.app/api-reference/channels)). So "a refund request was handled" could archive that notification for every Platform Admin in one server call. The Objects page says in-app feeds for objects (a true shared feed) are "on our roadmap" ([objects](https://docs.knock.app/concepts/objects)). **Uncertain:** exact filter semantics are only shown in a request example.
- **Identity / trigger:** Recipients are user IDs; users can be identified inline in the workflow trigger. Server triggers a workflow via `@knocklabs/node`. Client auth in production: enable "enhanced security mode" and pass a user token, a JWT the server signs **locally** with RS256 using `KNOCK_SIGNING_KEY` (`signUserToken` from `@knocklabs/node`), passed as `userToken` on `KnockProvider` ([security](https://docs.knock.app/in-app-ui/security-and-authentication)). Templates live in the Knock dashboard, or in code via the Knock CLI ([llms.txt](https://docs.knock.app/llms.txt)).
- **Pricing:** Free: 10,000 messages/mo, no card; a message is one message to one user on one channel. No hard cap; Knock contacts you to add billing. Feed retention unlimited. Starter $250/mo + usage ([pricing](https://knock.app/pricing)).
- **No credentials:** No mock mode (see above). Development environment still requires keys.

### Novu

- **React UI:** `@novu/react` `<Inbox />` with Bell, Notifications, InboxContent, Preferences parts; real-time unread count; style overrides, custom elements and icons; React 18+ ([inbox overview](https://docs.novu.co/platform/inbox/overview)). Headless: `useNotifications`, `useCounts` (unread/unseen/total), `useNovu` in `@novu/react`, and framework-agnostic `@novu/js` ([headless mode](https://docs.novu.co/platform/inbox/headless-mode)).
- **Real-time / toasts:** Hooks update in real time; for a toast, `novu.on('notifications.notification_received', ...)` ([headless mode](https://docs.novu.co/platform/inbox/headless-mode)).
- **State:** Read/unread, seen/unseen (via counts), archive; snooze is listed as a feature ([inbox overview](https://docs.novu.co/platform/inbox/overview)). **Uncertain:** the full action list is not on the pages read.
- **Shared state:** Not found. Bulk endpoints such as `POST /v2/subscribers/{subscriberId}/notifications/read` are per subscriber, filterable by tags/context ([API ref](https://docs.novu.co/api-reference/subscribers/update-all-notifications-state.md)). Cross-admin "handled" would mean looping over admins server-side.
- **Identity / trigger:** Subscribers by `subscriberId`, created on first session. Server triggers a workflow with `@novu/api`. Production client auth: enable HMAC; server computes `HMAC-SHA256(secretKey, subscriberId)` **locally** and passes `subscriberHash` ([prepare for production](https://docs.novu.co/platform/inbox/prepare-for-production)). Workflows can be defined in the dashboard or in code (Novu Framework).
- **Pricing:** Free: 10,000 workflow runs/mo, 5 workflows, 3 team members, 24 h activity-feed retention. Pro from $30/mo ([pricing](https://novu.co/pricing)). Note runs are billed per workflow trigger, not per channel message. Removing Novu branding is not available on Free ([prepare for production](https://docs.novu.co/platform/inbox/prepare-for-production)).
- **No credentials:** Only option is self-hosting (MIT core, heavy stack). Otherwise same as the others. **Uncertain:** which Inbox features are cloud-only when self-hosted.

### Courier

- **React UI:** `@trycourier/courier-react` (v9, React 18+) with `CourierInbox`, `CourierInboxPopupMenu`, `CourierToast`, `CourierPreferences`; `useCourier()` exposes `inbox.totalUnreadCount` and actions; theming via `CourierInboxTheme`/`CourierToastTheme`; custom views or fully custom UI ([React SDK](https://www.courier.com/docs/sdk-libraries/courier-react-web), [Inbox overview](https://www.courier.com/docs/platform/inbox/inbox-overview)).
- **Real-time / toasts:** `inbox.listenForUpdates()` opens a WebSocket. **Only vendor with a built-in toast component** synced to the feed.
- **State:** Read, opened, archived ([Inbox overview](https://www.courier.com/docs/platform/inbox/inbox-overview)). Per user; no shared state found.
- **Identity / trigger:** Server mints the client JWT by a **network call** to `POST /auth/issue-token` with scopes `user_id:<id> inbox:read:messages inbox:write:events`; no expiry if omitted ([auth](https://www.courier.com/docs/platform/inbox/authentication)). Server sends via `@trycourier/courier`.
- **Pricing:** Developer (free) 10,000 sends/mo; Business $0.005/send ([pricing](https://www.courier.com/pricing)). **Uncertain:** what counts as a send (FAQ answer blank).
- **No credentials:** No mock mode. The token-issue network call adds one more thing to fake in dev.

### MagicBell

- **React UI:** `@magicbell/react` with `ContextProvider` (takes User JWT), `FloatingInbox` (bell trigger + panel), `Inbox`, `InlineNotification`, `ToastContainer`; CSS custom properties for theming ([React](https://www.magicbell.com/docs/libraries/magicbell-react)). No documented headless hooks or standalone unread-count component.
- **Real-time / toasts:** "Persistent connection" for live updates ([in-app channel](https://www.magicbell.com/docs/channels/in_app)); built-in `ToastContainer`.
- **State:** Read/unread, archive, delete ([in-app channel](https://www.magicbell.com/docs/channels/in_app)). Seen not mentioned. No shared state found.
- **Identity / trigger:** User JWT signed **locally** with HS256 and the project secret, claims `user_external_id`/`user_email`, `api_key` ([user JWT](https://www.magicbell.com/docs/api/authentication/user)). Server sends a Broadcast (`title`, `content`, `action_url`, `category`, up to 1,000 `recipients`) ([broadcast](https://www.magicbell.com/docs/primitive/broadcast)). **Uncertain:** exact endpoint path and whether unknown users are auto-created.
- **Pricing:** Builder (free) only **1,000 deliveries/mo**, 1 project; Startup $249/mo ([pricing](https://www.magicbell.com/pricing)). Lowest free allowance of the five.
- **No credentials:** No mock mode.

### SuprSend

- **React UI:** `@suprsend/react` `Inbox` popover (also full-screen and side-sheet) with `bellComponent`, `badgeComponent`, `notificationComponent`, `headerRightComponent` (gets `markAllRead`), `theme`/`themeType`, built-in "Mark all as read" ([React in-app feed](https://docs.suprsend.com/docs/react-in-app-feed.md)). Headless: `useFeedClient`, `useFeedData`, `useFeed` ([headless](https://docs.suprsend.com/docs/headless-inbox)).
- **Real-time / toasts:** Socket-based feed with connection-status indicator. Toasts removed from `Inbox`; listen for the new-notification event and use a toast library, optionally with exported `ToastNotificationCard` ([React in-app feed](https://docs.suprsend.com/docs/react-in-app-feed.md)). **Uncertain:** exact event name in current SDK (`feed.new_notification` per search snippets).
- **State:** Seen, read, archived tracked per user ([inbox overview](https://docs.suprsend.com/docs/inbox-overview)). Objects (teams, roles) can be recipients and fan out to subscribers ([objects](https://docs.suprsend.com/docs/objects)); **uncertain** whether an object's feed has shared read state.
- **Identity / trigger:** Users by `distinct_id`. Production: enhanced security mode with a JWT signed **locally** with ES256 using a key from the dashboard ([client auth](https://docs.suprsend.com/docs/client-authentication)). Server triggers a workflow via `@suprsend/node-sdk`.
- **Pricing:** Free 10,000 notifications/mo with SuprSend branding on the feed; no hard stop on overage. Essentials $100/mo ([pricing](https://www.suprsend.com/pricing)).
- **No credentials:** No mock mode.

## Comparison

| | Knock | Novu | Courier | MagicBell | SuprSend |
|---|---|---|---|---|---|
| Bell + unread count | Yes | Yes | Yes | Yes (FloatingInbox) | Yes |
| Headless hooks | Yes | Yes (React + JS) | Yes (`useCourier`) | Not documented | Yes |
| Built-in toast | No (event + lib) | No (event + lib) | **Yes** | **Yes** | No (event + lib, card provided) |
| Seen / read / archived | All | All (+ snooze) | read/opened/archived | read/archived | All |
| Shared state across recipients | **Bulk archive by `trigger_data`** | Per-subscriber only | Not found | Not found | Objects, shared state unclear |
| Client token | Local RS256 JWT | Local HMAC | **Network** issue-token | Local HS256 JWT | Local ES256 JWT |
| Free tier | 10k messages | 10k runs, 5 workflows | 10k sends | **1k deliveries** | 10k notifications |
| Credential-free dev | No | Self-host only | No | No | No |

## Shortlist (not a decision)

1. **Knock**: strongest fit on shared state (one bulk call can archive a "handled" item for all Platform Admins via `trigger_data`), mature headless hooks for the local fallback, locally signed tokens, generous free tier. Trade-offs: no built-in toast; Knock branding on Free; Starter jumps to $250/mo.
2. **Novu**: open-source core (could self-host as a last resort), good headless hooks with a clean `notification_received` toast event, cheapest paid tier ($30/mo), HMAC is trivial to compute. Trade-offs: no cross-recipient state (loop per admin); Free caps at 5 workflows, which constrains the v1 catalogue; 24 h activity retention on Free.
3. **Courier**: most complete out-of-the-box UI (inbox, popup, toast, theme) so least UI code. Trade-offs: token issuance is a network call, so the no-credentials fallback must also stub auth; no shared state; "send" definition unclear.

Dropped: **MagicBell** (1,000 deliveries/mo free, no documented headless hooks) and **SuprSend** (viable and close to Knock in shape, but no stronger on any criterion and shared object-feed state unconfirmed; worth revisiting if Knock is rejected).

Whichever is chosen, the credential-free requirement means Cadence builds its own transport seam plus a local feed, mirroring `mailer.server.ts`.
