import type { SiteId } from './sun-explore-map';
import { AT_THE_GATE, FIRST_WINTER, LITTLE_LIGHTS, SIX_HOURS, TOMORROW } from './sun-explore-accounts';

export type SunExploreProgress = {
  stage: number;
  readGlove: boolean;
  taviHome: boolean;
};

export const INITIAL_PROGRESS: SunExploreProgress = {
  stage: 0, readGlove: false, taviHome: false,
};

export const BYPASS_KNOWN = 1;
export const TESTED = 2;
export const CONFIRMED = 3;
export const COOLING = 4;
export const DISMISSED = 5;

export function normalizeSunProgress(value?: Partial<SunExploreProgress> | null): SunExploreProgress {
  const savedStage = value?.stage ?? 0;
  const stage = Number.isInteger(savedStage) && savedStage >= 0 && savedStage <= DISMISSED ? savedStage : 0;
  return {
    stage,
    readGlove: value?.readGlove === true,
    taviHome: value?.taviHome === true && stage >= COOLING,
  };
}

export type Topic = 'main' | 'bypass' | 'crown' | 'glove' | 'winter' | 'family' | 'test' | 'cool' | 'ring';
type Choice = { label: string; topic: Topic };
type Story = { lines: string[]; choices?: Choice[] };

const maraChoices = (p: SunExploreProgress): Choice[] => [
  { label: 'What did you build?', topic: 'bypass' },
  { label: 'Ask about the crown', topic: 'crown' },
  ...(p.readGlove ? [{ label: 'Ask about the glove', topic: 'glove' as const }] : []),
  ...(p.stage === CONFIRMED ? [{ label: 'Begin the cooling cycle', topic: 'cool' as const }] : []),
];

export function sunStory(id: SiteId, topic: Topic, p: SunExploreProgress): Story {
  const tested = p.stage >= TESTED;
  const cooling = p.stage >= COOLING;
  const dismissed = p.stage >= DISMISSED;
  const say = (...lines: string[]): Story => ({ lines });

  switch (id) {
    case 'mara': {
      const lines = topic === 'cool' ? [
        'King: “Four minutes is encouraging. You need six hours.”',
        'Mara: “If the pressure drops, the crew can restart the furnace. We’ve rehearsed it.”',
        'King: “Who takes responsibility if we’re wrong?”',
        'Mara: “All of us. The same people who’ve been keeping this place alive.”',
        'King: “How long have you been here, Tavi?”\nTavi: “Third shift, Your Majesty.”',
        'King: “Who approved that?”\nTavi: “You did.”',
        'The King runs his hand over his signature in the shift register. He asks Tavi to show him the new gauge, then takes her seat.',
        'King: “Go home. I’ll take the first watch.”',
        'Mara gives the order. The King turns his Ruby to start cooling the furnace. You fit yours into the bypass socket.',
        'As the machines slow, you hear water running through the pipes. Then the speaking tube crackles.',
        'Pell: “It’s warm.”',
        'Mara hands back your Ruby. “Would you ring the bell?”',
      ] : topic === 'bypass' ? [
        '“The reservoirs hold six hours of heat. We built a bypass to feed it straight to the wards while the furnace cools.”',
        '“The King’s Ruby has to stay with the furnace. Yours fits the second socket in the Ash Tunnel. That lets us test the pipes with the furnace still running.”',
      ] : topic === 'crown' ? [
        '“My son made that. I promised I’d come home and see him wear it.”',
        '“The King wouldn’t open the gate till someone relieved me. By the time my shift ended, my son had gone home. He left the crown where I could see it.”',
        '“He grew out of paper crowns. The forge never grew out of emergency shifts.”',
      ] : topic === 'glove' ? [
        '“I burned my hand on a valve during the first winter. I was seventeen. The King tore his cloak to bandage it.”',
        '“He told me it was all right to cry. Nobody could hear over the pumps.”',
        'She studies the glove. “I wish you could have met him that night. Maybe you still can.”',
      ] : dismissed ? [
        '“The pressure held. We’re putting a maintenance schedule together. The engineers are working on an authorization the cooling crew can use themselves.”',
        '“I’m going home. Ask me again tomorrow and I’ll tell you how strange it feels to say that.”',
      ] : cooling ? [
        '“Listen.”', 'She waits. Water moves through the pipes. Two workers argue about tomorrow’s shift.',
        '“I used to imagine this place would sound peaceful. I think I prefer this. The bell is on the east side of the bridge.”',
      ] : p.stage === CONFIRMED ? [
        '“It reached the last house? I knew the numbers were right. It’s different hearing it from someone who was standing there.”',
        '“Now we have to ask the King to trust it for six hours.”',
      ] : tested ? [
        '“The pressure looks good here. Check the last house in Ward Four. If it reached Lyra’s tap, it reached the whole line. Pell’s down there.”',
      ] : [
        '“You’re the one the King granted a Ruby to. Good. I could use someone with that kind of authority.”',
        '“See that forge? It hasn’t had a proper rest in years. We built something that might change that. There’s a diagram in the old ash tunnel, or I can explain.”',
      ];
      return { lines, choices: topic === 'cool' ? [] : maraChoices(p) };
    }
    case 'crown': return say('A faded paper crown hangs from the railing. Its edges have curled in the heat.',
      'Inside, in a child’s handwriting: “For the best mum in the Sun.”',
      ...(p.readGlove ? ['This is the first thing you’d see from the cooling station window.'] : []));
    case 'statue': return say('“Here the Fiery King stood alone between his people and the cold.”',
      dismissed ? 'A handwritten plaque beneath it reads: “He wasn’t alone.” Someone has begun cleaning the workers’ names.' :
        'The workers’ names are etched along the base, half hidden behind newer stonework.');
    case 'bell': {
      if (topic === 'ring') return say('The bell echoes across the forge. Workers look up, waiting for another extension.',
        'Worker: “Another extension?”\nMara: “No. You’re done.”',
        'Worker: “Until supper?”\nMara: “Tomorrow.”',
        'Someone picks up their lunch tin. The King stays at the gauge and listens to the workers leave.');
      if (dismissed) return say('The handle is still warm. The forge workers have gone home.');
      return { lines: ['“To announce the end of a working shift.”', 'Someone has scratched a question beneath it. “Does it still remember how?”'],
        choices: cooling ? [{ label: 'Ring the bell', topic: 'ring' }] : [] };
    }
    case 'memory': return say('A cracked disc reads “Emergency Shift 01 — Royal Archive.” Alarms and hurried footsteps come through the recording.',
      'Foreman: “The lower wards have two hours of heat left.”\nEngineer: “The lines need six hours to cool.”',
      'King: “Then we don’t shut down.”\nEngineer: “Your Majesty, nobody can safely work that long.”\nKing: “I wasn’t asking them to work alone.”',
      'The recording distorts. Then you hear a crowd on the furnace floor.',
      'Mara, younger: “He’s taking the coolant valve himself?”\nKing: “I could use someone who knows which end of this wrench to hold.”',
      'Hours pass in broken fragments. Then a voice comes through the pumps. “Ward Four reports full heat!”',
      'King: “Well done, everyone.” Cheering overwhelms the microphone.',
      'The case reads: “Thirty-one hours. The greatest night this forge ever knew.”');
    case 'register': return dismissed ? say('Mandatory cooling interval: six hours. Maximum consecutive shifts: one.',
      'Mara, the foreman, and the Fiery King have signed the new schedule.') :
      say('“Emergency Shift 01 — Thirty-one hours. All workers volunteered.”',
        'Further on, the same line appears again and again. “Extension approved by the King.”',
        'The current page has no end time. Tavi’s name appears on three shifts in a row.');
    case 'proposal': return say('“Request for replacement heating lines: DENIED. The Royal Solar Forge has demonstrated sufficient emergency capacity.”',
      'Someone has written beneath it: “The emergency capacity is us.”',
      ...(cooling ? ['“Replacement budget resubmitted. Approval pending.”'] : []));
    case 'glove': return say('The glove is burned through at the palm. Someone patched it with a strip of royal red cloth.');
    case 'lever': return cooling ? say('The weld has been cut. A new notice requires independent crew authorization for any exception.') :
      say('“EMERGENCY COOLING — DO NOT OBSTRUCT.” The lever is welded open.', '“Temporary modification, authorized by the Fiery King.” The note is years old.');
    case 'blueprint': return say('Someone drew a second network over the old furnace plan in red ink. It runs from the heat reservoirs to the wards.',
      '“Six hours for the city. Six hours for us.”', '“Second Ruby authorization required for live test.”');
    case 'pipes': return say('The pipes have mismatched serial numbers. Some still carry addresses from condemned houses.',
      '“Winter One: Finished the junction. Winter Two: Replaced three joints. Winter Three: Passed everything except the live test.”',
      '“The King found another weak joint today. He was right. We replaced it. He still won’t give us a date.”');
    case 'socket':
      if (topic === 'test') return say('The Ruby glows in the socket. Stored heat rushes into the bypass. The old pipes shake, then settle.',
        'LOCAL PRESSURE: STABLE\nDISTRICT DELIVERY: UNCONFIRMED',
        'Mara, through the speaker: “Four minutes. The pipes held. Check whether the heat reached the last house.”',
        'You retrieve your Ruby. The test valve closes, leaving the ward’s pipes warm.');
      if (cooling) return say('Bypass active. Main furnace cooling. The pipes are holding pressure.');
      if (tested) return say('Four-minute test passed.', p.stage >= CONFIRMED ? 'Ward Four delivery confirmed.' : 'District delivery awaiting confirmation.');
      if (p.stage < BYPASS_KNOWN) return say('A Ruby-shaped socket sits above an unfamiliar valve. Handwritten warnings cover the housing.');
      return { lines: ['Independent authority detected. Isolated bypass test available.'],
        choices: [{ label: 'Insert Ruby · test the bypass', topic: 'test' }] };
    case 'nest': return cooling ? say('The ash hopper is quieter. Most of the wisps have drifted toward the reservoir.') :
      say('Tiny Cinder Wisps sleep in an ash hopper. A maintenance label warns that large colonies can overheat coolant.',
        'Someone drew a wisp asleep in a spoon. Under it they wrote, “Except Button. Button is a good boy.”');
    case 'lyra': return cooling ? say('“Pell called. I thought I’d be frightened, but the house is warm and Tavi is coming home. I think I’ll make something nice for supper.”') :
      tested ? say('“The tap got hot without the furnace pressure surging. Was that your test? Do you think it can keep doing that?”') :
        say('“My brother Pell works at the forge. So does my daughter. I know they need rest.”',
          '“It was four thousand degrees that first winter. I couldn’t feel my fingers. How is anyone supposed to survive that cold?”');
    case 'tap': return cooling ? say('The tap is still hot. Outside, the furnace has gone quiet.') :
      tested ? say('The tap hisses. The pipe glows steadily all the way to its last joint. The bypass reached the end of the line.') :
        say('The tap flickers as the furnace pressure changes. “Ward Four — Last connection on the district network.”');
    case 'pell': return cooling ? say('“I told them the pipes were warm. Never thought I’d say that with the furnace off. Don’t tell Mara I doubted her quite so much.”') :
      tested ? say('Pell puts a hand on the pipe. “Still warm. All right. Tell Mara I’m listening.”') :
        say('“People forget the first winter. The King carried coolant buckets till his hands were burned black.”',
          '“You find a way to keep my sister warm and I’ll be the first to turn that furnace off.”');
    case 'tube': return cooling ? say('The tube goes quiet. Then someone on the other end starts humming.') :
      tested ? say('Pell: “Ward Four reporting. Heat reached the last house.”\nMara: “Pressure stable?”\nPell: “Stable.”',
        'Mara: “Thank you, Pell.”\nPell: “Don’t thank me yet. Make it last six hours.”') :
        say('The tube carries the sound of distant pumps. Someone is counting pressure fluctuations.');
    case 'king': return {
      lines: topic === 'winter' ? [
        '“I remember carrying children into the furnace hall. I remember hoping they would wake up.”',
        '“People forget what a cold winter can do here. I cannot afford to.”',
      ] : cooling ? [
        '“The pressure has held. I keep expecting another alarm.”',
        'He checks the gauge again. “Mara was right about the bypass. She was right about more than that.”',
      ] : tested ? [
        '“Four minutes is encouraging. Four minutes aren’t six hours.”',
        '“Your Ruby grants you authority. It doesn’t grant you certainty. I wish it did.”',
      ] : p.stage >= BYPASS_KNOWN ? [
        '“You’ve seen Mara’s work. It’s remarkable engineering. But if it fails, the wards bear the cost.”',
      ] : ['“Ah, our challenger. I hope the Ruby has served you well.”', '“Forgive me for not giving you a proper welcome. The cooling system has been troublesome. It always is.”'],
      choices: [{ label: 'Why keep the forge running?', topic: 'winter' }],
    };
    case 'tavi': return {
      lines: topic === 'family' ? [
        '“My mother lives in Ward Four. Uncle Pell says our house has the worst pipes in the city.”',
        '“Whenever the pressure drops, I wonder if she’s cold. I suppose that’s why I keep agreeing to stay.”',
      ] : cooling ? [
        p.taviHome ? '“Mum got supper going the minute I came through the door.”' : '“The King told me to go home. Actually told me to leave.”',
        '“He asked me how to read the new gauge first. He’ll be fine.”',
      ] : ['“Sorry, I can’t talk long. I have to finish checking these gauges before the next shift.”',
        '“I’m not sure when that starts. I haven’t left since the one before last.”'],
      choices: [{ label: 'Ask about her family', topic: 'family' }],
    };
    case 'gauge': return cooling ? say('MAIN FURNACE: COOLING\nBYPASS HEAT DELIVERY: STABLE\nNEXT MAINTENANCE CHECK: SCHEDULED',
      'The warning light is dark.') : tested ? say('BYPASS TEST: PASSED\nFULL COOLING CYCLE: AWAITING AUTHORIZATION') :
        say('MAIN FURNACE: ACTIVE\nCOOLING CYCLE: OVERDUE', 'The warning light has faded its own casing.');
    case 'petitions': return dismissed
      ? say('Ward Four repairs. Filed again this morning. Lyra has added her name in the same space as last year.')
      : say('“Replacement heat lines, Ward Four.” Seven households signed. The return address on one signature has been crossed out and marked “moved.”',
        'A note in Mara’s handwriting reads, “Keep the original. They told us last year they never received it.”');
    case 'volunteers': return say('“First Winter. Emergency watch.” Each name is followed by a time and a signature.',
      'The last line reads, “Fiery King, coolant valve two.” The signature is crooked. Someone has drawn a little arrow to an oil stain beside it.');
    case 'coolantLog': return cooling
      ? say('“First cooling watch. Tavi relieved. Pressure steady.” The King has left a blank line for whoever takes the next watch.')
      : say('“North reservoir. Third watch.” The same hand has filled out three pages. The last reading appears twice, once off the edge of the line.',
        'In the margin, Tavi wrote, “If the pressure drops below this mark, call Mum before you call me.”');
    case 'letter': return say('“Tavi, your uncle says you’ll be home after this shift. There’s supper in the covered pot.”',
      '“I put your stool by the tap. You always used to sit there to warm up when you got home. It still fits under the pipe. I checked.”');
    case 'jointNote': return say('“First pressure test. Third joint failed.” A sketch shows where the pipe buckled.',
      'Another hand has written, “Use the elbow from the old bakery. Ours lasted forty years.” Below it, “Tried it. Held.”');
    case 'lunch': return say('Today’s special is a hot sandwich. Yesterday’s special is also a hot sandwich. Neither entry says what’s in it.');
    case 'cook': return say('“He wants his sandwich less toasted. I asked him how much less and he said ‘bread.’ Some people come here just to make work for me.”');
    case 'lunchGuest': return say('Orrin taps the crust against his plate. It rings.',
      '“I asked for something I could eat on my break. I suppose I could use it to hold the door open.”');
    case 'scarlet': return say('“Rusk says his door is crimson. I painted it. I know what was on the tin.”',
      '“Well, yes, the tin was labeled ‘RED.’ The lid was scarlet.”');
    case 'crimson': return say('“Scarlet in the morning. Crimson after supper. If Nemi wants to be right, she can come over earlier.”');
    case 'lostFound': return say('“One left glove. One right glove. They are different sizes. If they’re both yours, we’d like to know how.”');
    case 'toolRack': return say('The hammer is gone. A note on its hook reads, “Back in five.” Someone has added, “Minutes?” Under that, in a third hand, “Winters.”');
    case 'archiveWinter': return say(...FIRST_WINTER);
    case 'archiveBridge': return say(...AT_THE_GATE);
    case 'archiveReservoir': return say(...LITTLE_LIGHTS);
    case 'archiveTunnel': return say(...SIX_HOURS);
    case 'archiveWard': return dismissed ? say(...TOMORROW) : say('Pell’s notebook is held open by a spoon. The page is headed “Tomorrow.” There’s nothing on it yet.');
    case 'button': return dismissed ? say('A tiny Cinder Wisp is curled up in the spoon. It opens one glowing eye, shifts, and goes back to sleep.',
      '“WELCOME HOME, BUTTON.”') : say('A blackened spoon sits empty on the ledge. “Button’s bed. Please do not remove.”');
  }
}
