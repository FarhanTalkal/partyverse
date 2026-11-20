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
];
