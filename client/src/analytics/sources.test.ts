import { describe, expect, it } from "vitest";
import { classifySource, deviceFor, isOwnerPath } from "./sources";

const host = "batshi-home.co.il";

describe("classifySource", () => {
  it("treats an influencer link as an influencer, before UTM tags", () => {
    expect(classifySource({ search: "?ref=Etty&utm_source=ig", referrer: "https://l.instagram.com/", host }).source).toBe("influencer:etty");
  });

  it("maps UTM sources and their short aliases", () => {
    expect(classifySource({ search: "?utm_source=ig&utm_medium=social&utm_campaign=Rosh-Hashana", referrer: "", host })).toMatchObject({
      source: "instagram",
      medium: "social",
      campaign: "rosh-hashana",
    });
    expect(classifySource({ search: "?utm_source=newsletter", referrer: "", host }).source).toBe("newsletter");
  });

  it("recognises well-known referrers", () => {
    const from = (referrer: string) => classifySource({ search: "", referrer, host }).source;
    expect(from("https://l.instagram.com/?u=x")).toBe("instagram");
    expect(from("https://www.google.co.il/")).toBe("google");
    expect(from("https://m.facebook.com/")).toBe("facebook");
    expect(from("https://api.whatsapp.com/send")).toBe("whatsapp");
    expect(from("https://some-blog.example.org/post")).toBe("some-blog.example.org");
  });

  it("counts a Facebook click id alone as Facebook, and anything unknown as direct", () => {
    expect(classifySource({ search: "?fbclid=abc", referrer: "", host }).source).toBe("facebook");
    expect(classifySource({ search: "", referrer: "", host }).source).toBe("direct");
  });

  it("counts a visit from the shop's own pages as direct and never keeps unsafe characters", () => {
    expect(classifySource({ search: "", referrer: "https://batshi-home.co.il/shop", host }).source).toBe("direct");
    expect(classifySource({ search: "?ref=a b<script>", referrer: "", host }).source).toBe("influencer:abscript");
  });
});

describe("deviceFor and isOwnerPath", () => {
  it("splits by width", () => {
    expect([deviceFor(375), deviceFor(768), deviceFor(1440)]).toEqual(["mobile", "tablet", "desktop"]);
  });

  it("skips the owner's own pages", () => {
    expect(isOwnerPath("/studio")).toBe(true);
    expect(isOwnerPath("/analytics")).toBe(true);
    expect(isOwnerPath("/demand")).toBe(true);
    expect(isOwnerPath("/shop")).toBe(false);
    expect(isOwnerPath("/studio-lamps")).toBe(false);
  });
});
