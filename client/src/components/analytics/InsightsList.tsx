import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useId, useState } from "react";
import type { Insight, InsightTab } from "../../analytics/advice";
import { focusRing, ink, StatusWord } from "./shared";

/** How many messages show before "show more": three in one column on a phone, four (two rows of two) on a desktop. */
const FIRST_SCREEN_PHONE = 3;
const FIRST_SCREEN_DESKTOP = 4;

/** The prioritised messages: a status word, a title, one line of detail and a way to the numbers behind it. */
export function InsightsList({ insights, onOpen }: { insights: Insight[]; onOpen: (tab: InsightTab) => void }) {
  const [showAll, setShowAll] = useState(false);
  const listId = useId();
  const wide = useMediaQuery((theme: Theme) => theme.breakpoints.up("md"));
  const firstScreen = wide ? FIRST_SCREEN_DESKTOP : FIRST_SCREEN_PHONE;

  if (insights.length === 0) {
    return <Typography sx={{ color: ink.muted, fontSize: 16, lineHeight: 1.6 }}>אין כרגע משהו שדורש תשומת לב.</Typography>;
  }

  const shown = showAll ? insights : insights.slice(0, firstScreen);
  const hidden = insights.length - firstScreen;

  return (
    <>
      <Box
        id={listId}
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
          columnGap: { md: 8 },
          borderBottom: { xs: `1px solid ${ink.rule}`, md: "none" },
        }}
      >
        {shown.map((insight) => (
          <Box
            component="li"
            key={insight.id}
            sx={{ py: 2, borderTop: `1px solid ${ink.rule}`, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", columnGap: 3, rowGap: 0.5 }}
          >
            <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
              <StatusWord tone={insight.tone} />
              <Typography sx={{ mt: 0.5, fontSize: 17, fontWeight: 700, lineHeight: 1.45 }}>{insight.title}</Typography>
              <Typography sx={{ mt: 0.5, color: ink.muted, fontSize: 14, lineHeight: 1.6 }}>{insight.detail}</Typography>
            </Box>
            <Button
              variant="text"
              color="secondary"
              onClick={() => onOpen(insight.tab)}
              aria-label={`לפרטים: ${insight.title}`}
              sx={{ minHeight: 44, px: 1, marginInlineStart: -1, fontSize: 14, fontWeight: 700, ...focusRing }}
            >
              לפרטים
            </Button>
          </Box>
        ))}
      </Box>
      {hidden > 0 ? (
        <Button
          variant="text"
          color="secondary"
          aria-expanded={showAll}
          aria-controls={listId}
          onClick={() => setShowAll((current) => !current)}
          sx={{ mt: 0.5, minHeight: 44, px: 1, fontSize: 14, fontWeight: 700, ...focusRing }}
        >
          {showAll ? "הצג פחות" : hidden === 1 ? "עוד דבר אחד לבדוק" : `עוד ${hidden} דברים לבדוק`}
        </Button>
      ) : null}
    </>
  );
}
