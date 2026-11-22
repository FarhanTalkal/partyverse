export interface CuratedBluffScenario {
  id: string;
  title: string;
  synopsis: string;
  publicClues: string[];
  roles: Array<{
    role: string;
    background: string;
    secretObjective: string;
    privateClues: string[];
    isCulprit: boolean;
  }>;
}

export const BLUFF_BANK: CuratedBluffScenario[] = [
  {
    id: "bl-in-1",
    title: "The Missing Wedding Necklace",
    synopsis:
      "At a grand Delhi wedding, the bride's heirloom necklace vanished between the mehendi and the sangeet. The DJ dropped a beat, the lights flickered, and chaos followed. Someone in this baraat circle knows the truth.",
    publicClues: [
      "Glitter from the mehendi stage was found near the green room.",
      "A VIP guest badge went missing for twelve minutes.",
      "The catering manager reported an unlocked service corridor.",
      "CCTV lagged exactly during the sangeet bass drop.",
    ],
    roles: [
      {
        role: "Wedding Planner",
        background: "You coordinated vendors and knew every backstage route.",
        secretObjective: "Protect the family's reputation while finding the thief.",
        privateClues: ["You saw the VIP lounge door propped open with a shoe."],
        isCulprit: false,
      },
      {
        role: "DJ",
        background: "You ran the sangeet set and controlled the lighting cues.",
        secretObjective: "Keep the party alive while spotting suspicious exits.",
        privateClues: ["Your lighting board received a remote cue you didn't trigger."],
        isCulprit: false,
      },
      {
        role: "Cousin from Abroad",
        background: "You arrived late with oversized luggage and charm.",
        secretObjective: "You took the necklace for a private collector. Don't get caught.",
        privateClues: [
          "You used a borrowed staff lanyard during the blackout.",
          "The necklace is wrapped inside your duty-free shopping bag.",
        ],
        isCulprit: true,
      },
      {
        role: "Security Uncle",
        background: "You managed gate checks and guest lists.",
        secretObjective: "Identify the culprit before the pheras.",
        privateClues: ["One guest badge was cloned that afternoon."],
        isCulprit: false,
      },
      {
        role: "Makeup Artist",
        background: "You stayed backstage with the bridal party.",
        secretObjective: "Clear your team — someone used your vanity mirror area.",
        privateClues: ["You noticed saffron glitter on a stranger's cuff."],
        isCulprit: false,
      },
      {
        role: "Caterer",
        background: "You moved freely with trays between kitchen and lawn.",
        secretObjective: "Prove you never entered the bridal suite.",
        privateClues: ["The service corridor latch was already open before dinner."],
        isCulprit: false,
      },
      {
        role: "Influencer Guest",
        background: "You livestreamed the sangeet for clout.",
        secretObjective: "Get the scoop without becoming a suspect.",
        privateClues: ["Your stream froze during the exact blackout window."],
        isCulprit: false,
      },
      {
        role: "Family Investor",
        background: "You funded part of the wedding and arrived with two unknowns.",
        secretObjective: "Minimize scandal while learning the truth.",
        privateClues: ["One of your plus-ones used an alias on the invite."],
        isCulprit: false,
      },
    ],
  },
  {
    id: "bl-in-2",
    title: "Express Train Envelope",
    synopsis:
      "On the overnight Rajdhani, a sealed prize envelope for a college reunion game disappeared from the upper berth. AC lights blinked, chai spilled, and motives got messy.",
    publicClues: [
      "Muddy shoe prints lead from the door to berth 42.",
      "The envelope was last seen after the antakshari round.",
      "Someone borrowed the attendant's torch.",
      "The window latch near the luggage rack was unlocked.",
    ],
    roles: [
      {
        role: "Reunion Host",
        background: "You organized the prize challenge for old classmates.",
        secretObjective: "Keep the trip fun and find the envelope.",
        privateClues: ["You heard berth curtains rustle around 1:15am."],
        isCulprit: false,
      },
      {
        role: "Antakshari Champ",
        background: "You dominated the singing round and expected the prize.",
        secretObjective: "You took the envelope early. Avoid detection.",
        privateClues: [
          "You hid it inside a hollowed tiffin box.",
          "You unlocked the window as a distraction.",
        ],
        isCulprit: true,
      },
      {
        role: "TT Friend",
        background: "You know the coach layout and ticket quirks.",
        secretObjective: "Trace who left the muddy prints.",
        privateClues: ["The mud matches the platform puddle, not the pantry."],
        isCulprit: false,
      },
      {
        role: "Snack Supplier",
        background: "You kept distributing chips and chai refills.",
        secretObjective: "Prove you stayed in the aisle seats.",
        privateClues: ["The torch was already missing when you finished chai duty."],
        isCulprit: false,
      },
      {
        role: "Photographer",
        background: "You documented the reunion and checked night shots.",
        secretObjective: "Capture evidence without false accusations.",
        privateClues: ["A photo shows a silhouette near berth 42 at 1:12am."],
        isCulprit: false,
      },
      {
        role: "Lower Berth Roommate",
        background: "You woke during the jolt and storm of announcements.",
        secretObjective: "Protect your closest friend unless evidence is clear.",
        privateClues: ["Your bunkmate returned with wet socks after midnight."],
        isCulprit: false,
      },
    ],
  },
  {
    id: "bl-in-3",
    title: "The Vanishing Cricket Trophy",
    synopsis:
      "After a corporate gully-cricket final, the tiny silver trophy disappeared from the pavilion table during the victory selfies. Music blasted, golgappe arrived, and someone slipped away with glory in their bag.",
    publicClues: [
      "A team jersey was found stuffed behind the drinks cooler.",
      "The DJ playlist skipped right as the group photo started.",
      "Wet footprints lead from the pitch to the parking scooter stand.",
      "Someone paid for extra paneer rolls in cash and left no name.",
    ],
    roles: [
      {
        role: "Winning Captain",
        background: "You lifted the trophy first and passed it for photos.",
        secretObjective: "Recover the trophy without blaming your own side unfairly.",
        privateClues: ["You last saw it in the hands of someone wearing a spare bib."],
        isCulprit: false,
      },
      {
        role: "Rival Opener",
        background: "You lost the final and hung near the pavilion sulking.",
        secretObjective: "You took the trophy for 'insurance'. Don't get caught.",
        privateClues: [
          "You hid it under the spare pads in your kit bag.",
          "You asked the DJ to play a loud track as cover.",
        ],
        isCulprit: true,
      },
      {
        role: "Umpire Uncle",
        background: "You volunteered as umpire and knew every argument.",
        secretObjective: "Settle this fairly before HR gets involved.",
        privateClues: ["You noticed a scooter helmet with mud matching the pitch."],
        isCulprit: false,
      },
      {
        role: "Snack Sponsor",
        background: "You brought rolls and soft drinks for both teams.",
        secretObjective: "Prove you never left the food table.",
        privateClues: ["The cash for extra rolls was left by someone in a blue bib."],
        isCulprit: false,
      },
      {
        role: "Team Photographer",
        background: "You shot the victory selfies and checked the burst mode.",
        secretObjective: "Find visual proof without starting a fight.",
        privateClues: ["One frame shows a kit bag zipping shut behind the cooler."],
        isCulprit: false,
      },
      {
        role: "Scorer Intern",
        background: "You kept the scorebook and sat by the pavilion table.",
        secretObjective: "Protect your notebook and your reputation.",
        privateClues: ["You stepped away for 90 seconds to refill water."],
        isCulprit: false,
      },
    ],
  },
  {
    id: "bl-in-4",
    title: "Office Fridge Conspiracy",
    synopsis:
      "In a Bengaluru startup kitchen, someone's labeled biryani vanished at 2:07pm. Slack lit up, the microwave beeped twice, and trust among teammates hit an all-time low.",
    publicClues: [
      "The fridge door was left ajar and the light stayed on.",
      "A spicy aroma trailed toward the phone booths.",
      "Someone's access badge tapped the pantry twice in one minute.",
      "An empty takeaway box was found in the recycling with no sticker.",
    ],
    roles: [
      {
        role: "Hungry PM",
        background: "You skipped breakfast after a standup marathon.",
        secretObjective: "You ate the biryani. Act normal.",
        privateClues: [
          "You wiped the label and tossed the box downstairs.",
          "You used a teammate's badge joke-swipe earlier that looked real on logs.",
        ],
        isCulprit: true,
      },
      {
        role: "Office Manager",
        background: "You run pantry supplies and fridge rules.",
        secretObjective: "Find the culprit before the next all-hands.",
        privateClues: ["The double badge tap came from the design pod side."],
        isCulprit: false,
      },
      {
        role: "Backend Dev",
        background: "You live in the phone booths during deploys.",
        secretObjective: "Clear your name — you only smell of coffee.",
        privateClues: ["You saw someone hurry past with a steel spoon at 2:05."],
        isCulprit: false,
      },
      {
        role: "Designer",
        background: "You were near the pantry moodboarding lunch posts.",
        secretObjective: "Help solve it without roasting anyone publicly.",
        privateClues: ["The empty box had a faint turmeric fingerprint on the lid."],
        isCulprit: false,
      },
      {
        role: "Intern",
        background: "You just joined and fear fridge politics.",
        secretObjective: "Survive onboarding and learn who did it.",
        privateClues: ["You overheard 'don't tell Slack' near the microwave."],
        isCulprit: false,
      },
      {
        role: "QA Lead",
        background: "You document everything, including snack crimes.",
        secretObjective: "Collect consistent stories from everyone.",
        privateClues: ["Access logs show a badge alias that isn't in HR yet."],
        isCulprit: false,
      },
    ],
  },
];
