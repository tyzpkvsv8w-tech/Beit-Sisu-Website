import Link from "next/link";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { market } from "@/lib/constants";
import { getI18n } from "@/i18n";
import { logout } from "@/app/actions/auth";
import { LangSwitch } from "./LangSwitch";

async function unreadCount(userId: string) {
  return db.message.count({
    where: { readAt: null, senderId: { not: userId }, conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] } },
  });
}

const icons = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
};
const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{d}</svg>
);

export async function Header() {
  const [{ m }, user] = await Promise.all([getI18n(), getUser()]);
  const unread = user ? await unreadCount(user.id) : 0;
  const mk = market();
  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="ReKit" dir="ltr">Re<b>Kit</b></Link>
          <span className="country" title={m.common.moreCountries}>{mk.flag} {m.countries.aeShort}</span>
          <form className="searchbar desk" action="/browse" role="search">
            <input name="q" type="search" placeholder={m.common.searchPh} aria-label={m.common.searchLabel} />
            <button type="submit">{m.common.search}</button>
          </form>
          <nav className="nav" aria-label="Main">
            <Link href="/browse">{m.common.browse}</Link>
            {user && <Link href="/saved">{m.common.saved}</Link>}
            {user && <Link href="/messages">{m.common.messages}{unread > 0 && <span className="badge">{unread}</span>}</Link>}
          </nav>
          <div className="user-menu">
            <LangSwitch />
            {user ? (
              <>
                <Link className="linkbtn desk-only" href="/account">{user.name.split(" ")[0]}</Link>
                <form action={logout} className="desk-only"><button className="linkbtn" type="submit">{m.common.logOut}</button></form>
              </>
            ) : (
              <Link className="linkbtn desk-only" href="/login">{m.common.logIn}</Link>
            )}
          </div>
          <Link className="btn btn-primary btn-post" href="/sell">{m.common.postAdFree}</Link>
        </div>
      </header>
      <nav className="tabs" aria-label="App">
        <Link href="/"><span className="ic"><Icon d={icons.home} /></span>{m.common.home}</Link>
        <Link href="/browse"><span className="ic"><Icon d={icons.search} /></span>{m.common.search}</Link>
        <Link href="/sell" className="post-tab"><span className="ic"><Icon d={icons.plus} /></span>{m.common.sell}</Link>
        <Link href="/messages"><span className="ic"><Icon d={icons.chat} /></span>{m.common.chats}{unread > 0 && <span className="badge">{unread}</span>}</Link>
        <Link href={user ? "/account" : "/login"}><span className="ic"><Icon d={icons.user} /></span>{user ? m.common.account : m.common.logIn}</Link>
      </nav>
    </>
  );
}
