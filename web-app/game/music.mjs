const YEAR_BGM = [1, 2, 3, 4, 5].map((year) => ({
  year,
  tracks: [1, 2, 3].map((slot) => ({
    id: `year_${year}_${slot}`,
    title: `大${year} BGM ${slot}`,
    artist: "待定",
    kind: "学年 BGM",
    src: `./assets/music/year-${year}/track-${slot}.mp3`,
    lyricsSrc: "",
    allowsLyrics: false,
    placeholder: slot === 1 ? "默认曲，资源待上传" : "可切换曲，资源待上传",
  })),
}));

export const OPENING_TRACK = {
  id: "opening_fixed",
  title: "开头固定音乐",
  artist: "资源待上传",
  kind: "开头曲",
  src: "./assets/music/opening.mp3",
  lyricsSrc: "",
  allowsLyrics: false,
  placeholder: "气质参考：我的世界背景音乐",
};

export const ENDING_TRACKS = [
  endingTrack("old_boy", "老男孩", "筷子兄弟", 20, "青春像一条走远的河，回头时才发现还没好好道别。"),
  endingTrack("into_the_sea", "入海", "毛不易", 20, "成长和理想会在时间里互相作答，你要继续往人海里走。"),
  endingTrack("cheers", "干杯", "五月天", 20, "把回忆举起来碰一杯，哪怕时间不能真的倒退。"),
  endingTrack("protagonist", "主角", "马里奥", 20, "五年里真正留下的，是你遇见过的人和成为过的自己。"),
  endingTrack("proud_youth", "骄傲的少年", "南征北战", 4, "少年感不是没有害怕，而是害怕时仍然相信自己。"),
  endingTrack("remaining_summer", "剩下的盛夏", "TFBOYS", 4, "那个夏天被留在身后，却像还在操场边发亮。"),
  endingTrack("our_tomorrow", "我们的明天", "鹿晗", 4, "别被回头路拖住，明天在前面等你。"),
  endingTrack("those_years", "那些年", "胡夏", 4, "错过过雨，也错过过勇气，但你终于走到了今天。"),
  endingTrack("here_after_us", "后来的我们", "五月天", 4, "有些人不再并肩，却仍把彼此送向更远的人生。"),
];

export function musicForState(state) {
  if (!state) {
    return OPENING_TRACK;
  }
  if (state.ending) {
    return pickEndingTrack(state.seed);
  }
  const year = Math.min(5, Math.max(1, state.year || 1));
  return YEAR_BGM.find((group) => group.year === year)?.tracks[0] ?? OPENING_TRACK;
}

function pickEndingTrack(seed) {
  const total = ENDING_TRACKS.reduce((sum, track) => sum + track.weight, 0);
  let cursor = Math.abs(Number(seed) || 0) % total;
  for (const track of ENDING_TRACKS) {
    if (cursor < track.weight) return track;
    cursor -= track.weight;
  }
  return ENDING_TRACKS[0];
}

function endingTrack(id, title, artist, weight, intro) {
  return {
    id,
    title,
    artist,
    weight,
    intro,
    kind: "结束曲",
    src: `./assets/music/endings/${id}.mp3`,
    lyricsSrc: `./assets/lyrics/${id}.lrc`,
    allowsLyrics: true,
    placeholder: "结束曲资源待上传",
  };
}
