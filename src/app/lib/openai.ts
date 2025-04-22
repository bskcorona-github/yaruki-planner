import OpenAI from 'openai';
import { Task, Roadmap, RoadmapNode, MicroTask, LearningLevel } from '../types';
import crypto from 'crypto';

// OpenAIのAPIキーを取得
const apiKey = process.env.OPENAI_API_KEY;

// APIキーが設定されているか確認
if (!apiKey) {
  console.error('警告: OPENAI_API_KEYが設定されていません。.envまたは.env.localファイルに設定してください。');
}

// OpenAIのインスタンスを作成
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key-for-development',
  timeout: 180000, // 3分のタイムアウト設定
});

// APIが有効かチェックする関数
export const isApiAvailable = (): boolean => {
  return !!apiKey;
};

// タスクテキストから詳細情報を抽出する関数
export async function extractTaskDetails(taskText: string) {
  try {
    if (!isApiAvailable()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたはタスク管理アプリのAIアシスタントです。
          ユーザーが入力した目標やタスクの説明から、詳細情報を抽出してください。
          ユーザーの入力は大まかな目標である可能性が高いので、それを達成するための具体的な計画に変換する必要があります。
          
          ユーザーの目標から以下の情報を抽出または推測してJSON形式で返してください：
          
          1. タスクのタイトル（短く簡潔に）
          2. タスクの詳細な説明（目標の背景や重要性を含める）
          3. 期限（日付があれば、なければ適切な期限を推測）
          4. 優先度（'high', 'medium', 'low'のいずれか）
          5. 予想所要時間（分単位の数字、明示されていなければ見積り）
          6. 情報不足フラグ（追加情報が必要かどうか）
          7. 追加で必要な情報のリスト（質問形式で）
          
          また、学習目標の場合は、以下の情報も抽出または推測してください：
          8. 学習カテゴリ（'language', 'programming', 'exam', 'hobby', 'other'のいずれか）
          9. 現在のレベル（'beginner', 'intermediate', 'advanced'のいずれか）
          10. 一日あたりの学習可能時間（分単位）
          
          レスポンスは以下のJSON形式のみを返してください:
          {
            "title": "タスクのタイトル",
            "description": "タスクの詳細説明",
            "dueDate": "YYYY-MM-DD" または null,
            "priority": "high/medium/low",
            "estimatedTime": 数字（分）,
            "needsMoreInfo": true/false,
            "questions": ["質問1", "質問2", ...],
            "category": "language/programming/exam/hobby/other",
            "level": "beginner/intermediate/advanced",
            "dailyTimeAvailable": 数字（分）
          }`
        },
        {
          role: 'user',
          content: taskText
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // JSON文字列をパースしてオブジェクトに変換
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // 日付文字列をDate型に変換（nullの場合はそのまま）
    if (result.dueDate) {
      result.dueDate = new Date(result.dueDate);
    }
    
    return result;
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    // エラー時はデフォルト値を返す
    return {
      title: taskText,
      description: '',
      dueDate: null,
      priority: 'medium',
      estimatedTime: 60, // デフォルト1時間
      needsMoreInfo: false,
      questions: [],
      category: 'other',
      level: 'beginner',
      dailyTimeAvailable: 60
    };
  }
}

// 学習マスタープランを生成する関数
export async function generateLearningMasterPlan(taskTitle: string, taskDescription: string, dueDate: Date | null, additionalInfo: Record<string, string> = {}) {
  try {
    if (!isApiAvailable()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    
    console.log('マスタープラン生成開始: ', taskTitle);
    
    const systemPrompt = `あなたは教育専門家で、効率的な学習計画の立案が得意です。
    ユーザーの目標を実用的で詳細な学習マスタープランに変換してください。
    
    与えられた学習目標に対して、目標達成日までの全体的な学習計画を作成してください。
    
    以下の要素を含む包括的な学習マスタープランをJSON形式で返してください：
    
    1. goal: 明確な目標（例: "2025年6月末の英検2級合格"）
    2. learningPeriod: 学習期間の説明
    3. totalStudyHours: 総勉強時間の見積もり（週当たりの時間 × 週数）
    4. phases: 学習フェーズの配列（3〜5段階程度）
       - title: フェーズのタイトル（例: "基礎固め & 準2級の知識習得"）
       - weeks: 該当する週（例: "Week 1〜3"）
       - description: フェーズの詳細説明
       - tasks: この段階での主なタスク（3〜5個の配列）
    5. weeklySchedule: 週間スケジュールの例
       - weekday: 平日のスケジュール（配列）
         - activity: 活動内容
         - duration: 時間（分）
       - weekend: 週末のスケジュール（配列）
         - activity: 活動内容
         - duration: 時間（分）
    6. recommendedMaterials: 推奨教材のリスト（配列）
    7. weeklyChecklist: 毎週のチェックリスト項目（配列）
    8. steps: 従来のステップ形式のデータ（UI互換性のため）
       - title: ステップのタイトル
       - description: 詳細説明
       - dueDate: 期限
       - priority: 優先度
       - estimatedTotalTime: 予想合計時間（分）
    
    JSON形式のオブジェクトのみを返してください。
    特に、phasesとweeklyScheduleは実用的で具体的な内容にしてください。
    教材やリソースは、対象の学習内容や目標に適した具体的なものを推奨してください。
    dueDate形式はYYYY-MM-DD形式で指定してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `学習目標: ${taskTitle}
          詳細説明: ${taskDescription || 'なし'}
          目標達成日: ${dueDate ? dueDate.toISOString().split('T')[0] : '未設定'}
          ${Object.entries(additionalInfo).map(([key, value]) => `${key}: ${value}`).join('\n')}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    console.log('マスタープラン応答受信');
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      console.error('APIからの応答が空です');
      return {
        plan: [],
        details: createDefaultMasterPlanDetails(taskTitle, dueDate)
      };
    }

    try {
      // JSON応答をパース
      const parsedResponse = JSON.parse(responseContent.trim()) as ApiResponse;
      
      // 従来の形式との互換性を保つ
      let steps: StepData[] = [];
      
      // steps配列がある場合はそれを使用
      if (Array.isArray(parsedResponse.steps) && parsedResponse.steps.length > 0) {
        steps = parsedResponse.steps;
      } 
      // なければ、phasesからstepsを生成
      else if (Array.isArray(parsedResponse.phases) && parsedResponse.phases.length > 0) {
        steps = parsedResponse.phases.map((phase: LearningPhase, index: number) => {
          const stepNumber = index + 1;
          let stepDueDate: Date | null = null;
          
          // 目標期限がある場合、フェーズ数に応じて期間を分割
          if (dueDate) {
            const totalPhases = parsedResponse.phases?.length || 3;
            const daysDiff = Math.ceil((dueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
            const daysPerPhase = Math.ceil(daysDiff / totalPhases);
            const phaseEndDays = daysPerPhase * stepNumber;
            
            stepDueDate = new Date();
            stepDueDate.setDate(stepDueDate.getDate() + phaseEndDays);
            
            // 最終フェーズの期限は目標期限に設定
            if (stepNumber === totalPhases) {
              stepDueDate = new Date(dueDate);
            }
          } else {
            // 目標期限がない場合、1フェーズ2週間で設定
            stepDueDate = new Date();
            stepDueDate.setDate(stepDueDate.getDate() + (14 * stepNumber));
          }
          
          return {
            title: phase.title || `フェーズ${stepNumber}`,
            description: phase.description || `${taskTitle}の学習フェーズ${stepNumber}`,
            dueDate: stepDueDate.toISOString().split('T')[0],
            priority: index === 0 ? 'high' : 'medium',
            estimatedTotalTime: 120 * (index + 1) // 段階に応じて時間を増加
          };
        });
      }
      
      // ステップのデータ形式を変換
      const validSteps = steps.map((step: StepData) => {
        // 日付文字列をDate型に変換
        let dueDateObj = null;
        if (step.dueDate) {
          try {
            dueDateObj = new Date(step.dueDate);
            if (isNaN(dueDateObj.getTime())) {
              dueDateObj = calculateDefaultDueDate(dueDate);
            }
          } catch {
            dueDateObj = calculateDefaultDueDate(dueDate);
          }
        } else {
          dueDateObj = calculateDefaultDueDate(dueDate);
        }
        
        return {
          title: step.title || `${taskTitle}のステップ`,
          description: step.description || '目標達成のためのステップ',
          dueDate: dueDateObj,
          priority: step.priority && ['high', 'medium', 'low'].includes(step.priority) ? step.priority : 'medium',
          estimatedTotalTime: step.estimatedTotalTime && !isNaN(Number(step.estimatedTotalTime)) ? Number(step.estimatedTotalTime) : 120
        };
      });
      
      // 詳細な学習計画情報を整形
      const planDetails: MasterPlanDetails = {
        goal: parsedResponse.goal || taskTitle,
        learningPeriod: parsedResponse.learningPeriod || "詳細な学習期間は未設定です",
        totalStudyHours: parsedResponse.totalStudyHours || "学習時間はタスクの進行に応じて調整してください",
        phases: Array.isArray(parsedResponse.phases) ? parsedResponse.phases : [],
        weeklySchedule: {
          weekday: Array.isArray(parsedResponse.weeklySchedule?.weekday) ? parsedResponse.weeklySchedule.weekday : [],
          weekend: Array.isArray(parsedResponse.weeklySchedule?.weekend) ? parsedResponse.weeklySchedule.weekend : []
        },
        recommendedMaterials: Array.isArray(parsedResponse.recommendedMaterials) ? parsedResponse.recommendedMaterials : [],
        weeklyChecklist: Array.isArray(parsedResponse.weeklyChecklist) ? parsedResponse.weeklyChecklist : []
      };
      
      console.log(`マスタープラン生成完了: ${validSteps.length}ステップ`);
      return {
        plan: validSteps,
        details: planDetails
      };
    } catch (error) {
      console.error('JSON解析エラー:', error);
      // デフォルトのマスタープランを返す
      return {
        plan: createDefaultMasterPlan(taskTitle, dueDate),
        details: createDefaultMasterPlanDetails(taskTitle, dueDate)
      };
    }
  } catch (error) {
    console.error('マスタープラン生成エラー:', error);
    return {
      plan: createDefaultMasterPlan(taskTitle, dueDate),
      details: createDefaultMasterPlanDetails(taskTitle, dueDate)
    };
  }
}

// ヘルパー関数：デフォルトのマスタープラン詳細情報を作成
function createDefaultMasterPlanDetails(title: string, dueDate: Date | null): MasterPlanDetails {
  const today = new Date();
  const targetDate = dueDate || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // デフォルトは30日後
  const weekCount = Math.ceil((targetDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  return {
    goal: `${title}の習得・完了`,
    learningPeriod: `${weekCount}週間（現在から${targetDate.toISOString().split('T')[0]}まで）`,
    totalStudyHours: `平日2時間×5日、週末3時間×2日 = 約${10 + 6}時間/週 × ${weekCount}週間 = 約${(10 + 6) * weekCount}時間`,
    phases: [
      {
        title: "基礎学習フェーズ",
        weeks: `Week 1〜${Math.ceil(weekCount / 3)}`,
        description: `${title}の基礎を固める期間です。基本概念や用語を学び、基礎的なスキルを習得します。`,
        tasks: [
          "基本的な知識・概念の習得",
          "基礎的な練習問題の解決",
          "学習リソースの確保と計画の見直し"
        ]
      },
      {
        title: "応用学習フェーズ",
        weeks: `Week ${Math.ceil(weekCount / 3) + 1}〜${Math.ceil(weekCount * 2 / 3)}`,
        description: `基礎知識を応用し、より複雑な問題に取り組む期間です。実践的なスキルを身につけます。`,
        tasks: [
          "応用問題への取り組み",
          "実践的な演習の実施",
          "弱点の特定と集中強化"
        ]
      },
      {
        title: "仕上げフェーズ",
        weeks: `Week ${Math.ceil(weekCount * 2 / 3) + 1}〜${weekCount}`,
        description: `学んだ知識を総合的に活用し、最終目標達成に向けた総仕上げを行います。`,
        tasks: [
          "総合的な復習と弱点補強",
          "模擬テストや総合演習",
          "最終評価と成果の確認"
        ]
      }
    ],
    weeklySchedule: {
      weekday: [
        { activity: "基礎知識の学習", duration: 30 },
        { activity: "演習問題", duration: 60 },
        { activity: "復習", duration: 30 }
      ],
      weekend: [
        { activity: "今週の総復習", duration: 60 },
        { activity: "応用問題演習", duration: 90 },
        { activity: "次週の準備", duration: 30 }
      ]
    },
    recommendedMaterials: [
      `「${title}入門」基礎テキスト`,
      `「${title}問題集」`,
      `「${title}オンライン講座」`,
      `「${title}実践アプリ」`
    ],
    weeklyChecklist: [
      "基礎知識の理解度チェック",
      "演習問題10問以上解く",
      "学習内容の振り返りノート作成",
      "次週の学習計画の見直し"
    ]
  };
}

// 学習マスタープランの詳細情報の型定義
interface MasterPlanDetails {
  goal: string;
  learningPeriod: string;
  totalStudyHours: string;
  phases: Array<LearningPhase>;
  weeklySchedule: {
    weekday: Array<ScheduleActivity>;
    weekend: Array<ScheduleActivity>;
  };
  recommendedMaterials: string[];
  weeklyChecklist: string[];
}

interface LearningPhase {
  title: string;
  weeks: string;
  description: string;
  tasks: string[];
}

interface ScheduleActivity {
  activity: string;
  duration: number;
}

// APIレスポンスの型定義
interface ApiResponse {
  goal?: string;
  learningPeriod?: string;
  totalStudyHours?: string;
  phases?: LearningPhase[];
  weeklySchedule?: {
    weekday?: ScheduleActivity[];
    weekend?: ScheduleActivity[];
  };
  recommendedMaterials?: string[];
  weeklyChecklist?: string[];
  steps?: StepData[];
}

interface StepData {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  estimatedTotalTime?: number;
}

// 日々のタスクと練習問題を生成する関数
export async function generateDailyTask(
  masterStepTitle: string, 
  category: string, 
  level: string, 
  timeAvailable: number,
  masterPlanDetails?: MasterPlanDetails,
  previousResults: { completed: boolean, taskId: string }[] = []
) {
  try {
    console.log('日々のタスク生成開始:', masterStepTitle);
    
    // 前回の結果から難易度調整
    const performance = previousResults.length > 0 
      ? previousResults.filter(r => r.completed).length / previousResults.length 
      : 0.5;
    
    let difficulty = 'medium';
    if (performance > 0.8) difficulty = 'hard';
    else if (performance < 0.4) difficulty = 'easy';
    
    // マスタープランの詳細情報から週間スケジュールの活動を取得
    let suggestedActivities: string[] = [];
    let weeklyChecklist: string[] = [];
    let currentPhase = '';
    let learningGoal = '';
    
    if (masterPlanDetails) {
      // 平日と週末の活動を合わせる
      if (masterPlanDetails.weeklySchedule.weekday) {
        suggestedActivities = suggestedActivities.concat(
          masterPlanDetails.weeklySchedule.weekday.map(item => item.activity)
        );
      }
      if (masterPlanDetails.weeklySchedule.weekend) {
        suggestedActivities = suggestedActivities.concat(
          masterPlanDetails.weeklySchedule.weekend.map(item => item.activity)
        );
      }
      
      // チェックリスト項目を取得
      if (Array.isArray(masterPlanDetails.weeklyChecklist)) {
        weeklyChecklist = masterPlanDetails.weeklyChecklist;
      }
      
      // 現在のフェーズと目標を取得
      if (Array.isArray(masterPlanDetails.phases) && masterPlanDetails.phases.length > 0) {
        currentPhase = masterPlanDetails.phases[0].title; // 一番最初のフェーズを使用
      }
      
      learningGoal = masterPlanDetails.goal;
    }
    
    const systemPrompt = `あなたは教育専門家で、効率的な学習教材の作成が得意です。
    学習者のレベルと利用可能時間に合わせた、今日の学習タスクと具体的な練習問題を作成してください。
    
    以下の情報に基づいて、本日の学習タスクを作成します：
    - 学習目標: ${learningGoal || masterStepTitle}
    - 現在のフェーズ: ${currentPhase || masterStepTitle}
    - 学習カテゴリ: ${category}
    - 学習者のレベル: ${level}
    - 利用可能時間: ${timeAvailable}分
    - 難易度設定: ${difficulty}（前回の結果に基づく調整）
    - 推奨活動: ${suggestedActivities.join(', ')}
    - 週間チェックリスト: ${weeklyChecklist.join(', ')}
    
    本日のタスクは、具体的な課題、実行可能な内容、そして実際のスキルを構築する練習問題を含むべきです。
    以下の要素を含めてください：
    
    1. title: 本日のタスクのタイトル（例: 「HTMLの基礎: タグと構造を学ぶ」）
    2. description: タスクの具体的な説明と本日の学習目標
    3. estimatedTime: 予想所要時間（${timeAvailable}分以内）
    4. preparationSteps: 始める前の準備ステップ（環境構築、ツール設定など）
    5. learningMaterials: 推奨学習リソースと参考資料のリスト
    6. codingTasks: 取り組むべきコーディング課題のリスト（詳細な説明と共に）
    7. exercises: 具体的な練習問題（例題や回答含む）。以下を含む：
       - 問題文
       - サンプルコード（該当する場合）
       - 正解または期待される結果
       - 解説
    8. checklistItems: 完了確認用のチェックリスト項目
    9. nextSteps: 次回の学習のヒントと準備すべきこと
    
    特に重要:
    - コーディング課題は、コピー＆ペーストですぐに試せる実際のコードスニペットを含める
    - 練習問題は、実際に手を動かして取り組める具体的な内容にする
    - 説明は簡潔かつ明確に、初心者にも理解できる言葉で
    - 学習カテゴリに適した実践的な問題を含める
    
    必ず以下の形式のJSONオブジェクトのみを返してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `本日の学習タスクと具体的な練習問題を作成してください。
          カテゴリは${category}です。レベルは${level}です。利用可能時間は${timeAvailable}分です。`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyTask = JSON.parse(response.choices[0].message.content || '{}') as any;
    console.log('日々のタスク生成完了');
    
    return dailyTask;
  } catch (error) {
    console.error('日々のタスク生成エラー:', error);
    // エラー時はデフォルトの日々のタスクを返す
    return {
      title: `${masterStepTitle}の学習`,
      description: '今日の学習タスクを完了させましょう',
      estimatedTime: timeAvailable,
      preparationSteps: ['学習環境を整える', '必要なツールを確認する'],
      learningMaterials: ['基本的なチュートリアル', 'オンライン学習リソース'],
      codingTasks: ['基本的な概念を理解するための簡単な練習'],
      exercises: [
        {
          question: 'サンプル問題1',
          sampleCode: '// ここにサンプルコードが入ります',
          answer: '正解例',
          explanation: 'これはサンプル問題です。実際のAPIコールでは、より適切な問題が生成されます。'
        }
      ],
      checklistItems: ['基本概念を理解する', 'サンプルコードを実行してみる', '練習問題に取り組む'],
      nextSteps: ['学んだ内容を復習する', '次回の学習テーマを確認する']
    };
  }
}

// 進捗更新の型定義
interface ProgressUpdate {
  encouragement: string;
  analysis: string;
  tips: string[];
  nextFocus: string;
  reflection: string;
}

// 日々のタスクの型定義
interface DailyTask {
  title: string;
  description: string;
  estimatedTime: number;
  preparationSteps: string[];
  learningMaterials: string[];
  codingTasks: string[];
  exercises: Array<{
    question: string;
    sampleCode?: string;
    answer: string;
    explanation: string;
  }>;
  checklistItems: string[];
  nextSteps: string[];
}

// ユーザーの進捗を更新し、次のステップを提案する関数
export async function formatProgressUpdate(
  dailyTask: DailyTask,
  isCompleted: boolean,
  userFeedback: string,
  learningGoal: string,
  currentPhase: string
): Promise<ProgressUpdate> {
  try {
    console.log('進捗更新生成開始');
    
    const systemPrompt = `あなたは学習コーチとして、ユーザーの学習進捗を分析し、前向きでモチベーションを高めるフィードバックと次のステップを提案します。
    
    ユーザーが取り組んだ本日のタスクと、その完了状況に基づいて、以下の要素を含むフィードバックを作成してください：
    
    1. encouragement: ユーザーの努力を称える前向きなメッセージ
    2. analysis: 完了または未完了の項目についての簡潔な分析
    3. tips: 学習をより効果的にするためのヒントや提案（1〜3つ）
    4. nextFocus: 次に集中すべき学習内容や概念の提案
    5. reflection: ユーザーが自己評価するための質問（1〜2つ）
    
    返答は励ましとモチベーションを重視し、ユーザーが次のステップに進むための具体的なアドバイスを含めてください。
    未完了の場合も前向きに、どのように取り組めば良いかを提案してください。
    
    必ず以下の形式のJSONオブジェクトのみを返してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `学習目標: ${learningGoal}
          現在のフェーズ: ${currentPhase}
          本日のタスク: ${dailyTask.title}
          タスク完了状況: ${isCompleted ? '完了しました' : '完了できませんでした'}
          ユーザーのフィードバック: ${userFeedback || 'フィードバックなし'}
          
          私の進捗について分析し、次のステップについてアドバイスをお願いします。`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const progressUpdate = JSON.parse(response.choices[0].message.content || '{}') as ProgressUpdate;
    console.log('進捗更新生成完了');
    
    return progressUpdate;
  } catch (error) {
    console.error('進捗更新生成エラー:', error);
    // エラー時はデフォルトのフィードバックを返す
    return {
      encouragement: '今日も学習に取り組んでくれてありがとう！',
      analysis: isCompleted 
        ? 'タスクを完了できたことは素晴らしい成果です。着実に進歩しています。' 
        : '完了できなかったタスクも、学習の一部です。次回に活かしましょう。',
      tips: [
        '毎日少しずつでも続けることが重要です。',
        '難しい部分は何度も繰り返し練習しましょう。',
        'わからないことはすぐに質問すると効率的です。'
      ],
      nextFocus: '次は基本的な概念の理解を深め、実践的な問題に取り組みましょう。',
      reflection: '今日学んだことで最も興味深かったのはどんな部分でしたか？'
    };
  }
}

// モチベーションを高めるメッセージを生成する関数
export async function generateMotivationalMessage(tasks: Task[]) {
  try {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    
    // 期限が近いタスクを特定
    const today = new Date();
    const upcomingTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.dueDate && 
      t.dueDate > today && 
      ((t.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 3)
    );
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたはタスク管理アプリのAIコーチです。
          ユーザーのタスク状況に基づいて、モチベーションを高めつつも実用的なアドバイスを含むメッセージを生成してください。
          フレンドリーかつ前向きで、かつ具体的なアクションを促すメッセージを作成してください。
          
          特に期限が近いタスクがある場合は警告を含め、遅れているタスクがある場合は解決策を提案してください。
          
          レスポンスは以下のJSON形式のみを返してください:
          {
            "greeting": "挨拶文",
            "message": "メインメッセージ（状況分析と励まし）",
            "urgentMessage": "期限が近いタスクに関する警告（該当タスクがなければ空文字）",
            "goals": ["今日の具体的な行動目標1", "今日の具体的な行動目標2"],
            "tips": "学習や時間管理に関する実用的なヒント",
            "closing": "締めのメッセージ"
          }`
        },
        {
          role: 'user',
          content: `現在のタスク状況:
          総タスク数: ${totalTasks}
          完了タスク: ${completedTasks}
          未完了タスク: ${pendingTasks}
          期限が近いタスク: ${upcomingTasks.length > 0 ? upcomingTasks.map(t => t.title).join(', ') : 'なし'}
          時間帯: ${new Date().getHours() < 12 ? '午前' : '午後'}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // JSON文字列をパースしてオブジェクトに変換
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    // エラー時はデフォルトメッセージを返す
    return {
      greeting: 'こんにちは！',
      message: '今日も目標に向かって一歩ずつ進みましょう。',
      urgentMessage: '',
      goals: ['未完了タスクを一つ終わらせる', '新しい目標を設定する'],
      tips: '大きなタスクは小さく分けると達成しやすくなります。',
      closing: 'あなたならできます！'
    };
  }
}

// ヘルパー関数：デフォルトのマスタープランを作成
function createDefaultMasterPlan(title: string, dueDate: Date | null): Array<{
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  estimatedTotalTime: number;
}> {
  const today = new Date();
  const targetDate = dueDate || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // デフォルトは30日後
  const daysDiff = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
  
  // 日数に応じてステップ数を調整（最小3、最大5）
  const stepCount = Math.min(5, Math.max(3, Math.ceil(daysDiff / 7)));
  const daysPerStep = Math.floor(daysDiff / stepCount);
  
  const plan = [];
  
  for (let i = 0; i < stepCount; i++) {
    const stepDueDate = new Date(today.getTime() + (i + 1) * daysPerStep * 24 * 60 * 60 * 1000);
    if (stepDueDate > targetDate) stepDueDate.setTime(targetDate.getTime());
    
    plan.push({
      title: i === 0 ? `${title}の基礎学習` : 
             i === stepCount - 1 ? `${title}の仕上げ` : 
             `${title}のステップ${i + 1}`,
      description: i === 0 ? '基礎的な内容を学習する' : 
                   i === stepCount - 1 ? '学習内容の総まとめと復習' : 
                   `${title}に関する発展的な内容を学ぶ`,
      dueDate: stepDueDate,
      priority: i === 0 ? 'high' as const : 'medium' as const,
      estimatedTotalTime: 120 * (i + 1)
    });
  }
  
  return plan;
}

// ヘルパー関数：デフォルトの期限日を計算
function calculateDefaultDueDate(targetDueDate: Date | null): Date {
  const today = new Date();
  
  if (!targetDueDate) {
    // 目標期限が設定されていない場合、今日から30日後をデフォルトとする
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 30);
    return defaultDate;
  }
  
  // 目標期限までの日数を計算
  const daysDiff = Math.max(1, Math.ceil((targetDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
  
  // ステップ数を推定（最小3、最大5）
  const stepCount = Math.min(5, Math.max(3, Math.ceil(daysDiff / 7)));
  
  // ステップごとの均等な日数
  const daysPerStep = Math.floor(daysDiff / stepCount);
  
  // 今日から1ステップ分の日数後の日付を計算
  const defaultDate = new Date(today);
  defaultDate.setDate(today.getDate() + daysPerStep);
  
  // 計算した日付が目標期限を超える場合は、目標期限を返す
  if (defaultDate > targetDueDate) {
    return targetDueDate;
  }
  
  return defaultDate;
}

// サブタスクに分割する関数
export async function divideIntoSubtasks(taskTitle: string, taskDescription: string, additionalInfo: Record<string, string> = {}) {
  try {
    console.log('OpenAI API呼び出し開始: ', taskTitle);
    
    const systemPrompt = `あなたはタスク管理の専門家です。
    ユーザーの入力したタスクや目標を、より具体的で管理可能なサブタスクに分割してください。
    
    与えられたタスクまたは目標に対して、それを達成するために必要な具体的なサブタスクのリストを作成してください。
    各サブタスクは、タスク全体の一部を担い、明確で具体的な行動を表すものにしてください。
    サブタスクの数は5〜10個が理想的です。
    
    各サブタスクには以下の情報を含めてください:
    
    1. title: サブタスクのタイトル（短く、行動指向的に）
    2. description: サブタスクの詳細な説明
    3. dueDate: 推奨される期限（YYYY-MM-DD形式）
    4. priority: 優先度（"high", "medium", "low"のいずれか）
    5. estimatedTime: 予想所要時間（分単位）
    
    以下の形式の配列JSONのみを返してください:
    [
      {
        "title": "サブタスク1のタイトル",
        "description": "サブタスク1の詳細説明",
        "dueDate": "YYYY-MM-DD",
        "priority": "high/medium/low",
        "estimatedTime": 数字（分）
      },
      {
        "title": "サブタスク2のタイトル", 
        "description": "サブタスク2の詳細説明",
        "dueDate": "YYYY-MM-DD",
        "priority": "high/medium/low",
        "estimatedTime": 数字（分）
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `タスク: ${taskTitle}
          詳細説明: ${taskDescription || 'なし'}
          ${Object.entries(additionalInfo).map(([key, value]) => `${key}: ${value}`).join('\n')}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    console.log('OpenAI API応答受信');
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      console.error('APIからの応答が空です');
      return [];
    }
    
    let result;
    try {
      // JSON応答をパース
      const jsonStr = responseContent.trim();
      
      if (jsonStr.startsWith('[') && jsonStr.endsWith(']')) {
        result = JSON.parse(jsonStr);
      } else if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
        console.log('オブジェクト形式で返されたレスポンスを配列に変換します');
        const parsedObj = JSON.parse(jsonStr);
        // オブジェクト内に配列があるか探す
        if (Array.isArray(parsedObj.subtasks) || Array.isArray(parsedObj.tasks) || Array.isArray(parsedObj.items)) {
          result = Array.isArray(parsedObj.subtasks) ? parsedObj.subtasks : 
                   Array.isArray(parsedObj.tasks) ? parsedObj.tasks : parsedObj.items;
        } else {
          // 配列が見つからない場合、オブジェクト自体を配列の要素として扱う
          result = [parsedObj];
        }
      } else {
        // JSONの配列が見つからない
        throw new Error('JSONデータが見つかりませんでした');
      }
    } catch (error) {
      console.error('JSON解析エラー:', error);
      // デフォルトのサブタスクを返す
      return createDefaultSubtasks(taskTitle);
    }
    
    if (!Array.isArray(result) || result.length === 0) {
      console.error('サブタスク生成結果が空または配列ではありません');
      return createDefaultSubtasks(taskTitle);
    }
    
    // サブタスク数が少なすぎる場合、デフォルトを追加
    if (result.length < 2) {
      console.log('サブタスクが少なすぎます。デフォルトサブタスクを追加します。');
      const defaultSubtasks = createDefaultSubtasks(taskTitle);
      result = [...result, ...defaultSubtasks.slice(0, 2)];
    }
    
    // データの検証と変換
    const validSubtasks = result.map(subtask => {
      // 日付文字列をDate型に変換
      let dueDateObj = null;
      if (subtask.dueDate) {
        try {
          dueDateObj = new Date(subtask.dueDate);
          if (isNaN(dueDateObj.getTime())) {
            // 無効な日付の場合、今日から7日後をデフォルトとする
            dueDateObj = new Date();
            dueDateObj.setDate(dueDateObj.getDate() + 7);
          }
        } catch {
          dueDateObj = new Date();
          dueDateObj.setDate(dueDateObj.getDate() + 7);
        }
      } else {
        // 日付がない場合、今日から7日後をデフォルトとする
        dueDateObj = new Date();
        dueDateObj.setDate(dueDateObj.getDate() + 7);
      }
      
      return {
        title: subtask.title || `${taskTitle}のサブタスク`,
        description: subtask.description || '詳細な説明はありません',
        dueDate: dueDateObj,
        priority: subtask.priority && ['high', 'medium', 'low'].includes(subtask.priority) ? subtask.priority : 'medium',
        estimatedTime: subtask.estimatedTime && !isNaN(Number(subtask.estimatedTime)) ? Number(subtask.estimatedTime) : 60
      };
    });
    
    console.log(`有効なサブタスク数: ${validSubtasks.length}`);
    return validSubtasks;
  } catch (error) {
    console.error('サブタスク生成エラー:', error);
    return createDefaultSubtasks(taskTitle);
  }
}

// ヘルパー関数：デフォルトのサブタスクを作成
function createDefaultSubtasks(title: string): Array<{
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
}> {
  const today = new Date();
  
  return [
    {
      title: `${title}の計画を立てる`,
      description: '目標達成のための詳細な計画を立案する',
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3日後
      priority: 'high' as const,
      estimatedTime: 60
    },
    {
      title: `${title}の資料を集める`,
      description: '必要な教材や参考資料を集める',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7日後
      priority: 'medium' as const,
      estimatedTime: 120
    },
    {
      title: `${title}の進捗を確認する`,
      description: '目標に向けての進捗状況を確認し、必要に応じて計画を調整する',
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14日後
      priority: 'medium' as const,
      estimatedTime: 30
    }
  ];
}

// ロードマップ生成の関数
export async function generateRoadmap(
  goal: string,
  timeframe: string = '3ヶ月',
  userLevel: LearningLevel = 'beginner',
  userPreference?: string
): Promise<Roadmap> {
  try {
    if (!isApiAvailable()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    
    console.log('ロードマップ生成開始:', goal);
    
    // GPTへのプロンプト
    const prompt = `
      あなたは学習ロードマップ作成の専門家です。
      以下の学習目標に対して、詳細なロードマップを作成してください。

      学習目標: ${goal}
      時間枠: ${timeframe || '特に指定なし'}
      現在のレベル: ${userLevel || '未指定'}
      ${userPreference ? `ユーザー設定: ${userPreference}` : ''}
      
      この目標を達成するための詳細なロードマップを作成してください。実践的で具体的な学習パスを示し、
      以下の情報を含めてください：

      1. ロードマップ全体のタイトル
      2. 詳細な説明
      3. 予想される総学習時間（時間単位）
      4. 学習ノードのリスト（階層構造、各ノードには以下を含む）：
        - タイトル
        - 説明
        - 重要度（'essential'、'recommended'、'optional'のいずれか）
        - 予想される学習時間（時間単位）
        - 子ノード（階層構造を形成）
      5. 主要なマイルストーン（重要な達成ポイント）

      レスポンスは以下のJSON形式で返してください：
      {
        "title": "ロードマップのタイトル",
        "description": "詳細な説明",
        "estimatedTotalHours": 数値,
        "nodes": [
          {
            "title": "ノード1タイトル",
            "description": "ノード1の説明",
            "importance": "essential/recommended/optional",
            "estimatedHours": 数値,
            "children": [
              // 子ノード（同じ構造）
            ]
          },
          // 他のルートノード
        ],
        "milestones": [
          {
            "title": "マイルストーン1",
            "description": "説明",
            "nodeIds": [] // 関連するノードのID（自動生成されるため空配列を返す）
          }
        ]
      }
      `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `目標: ${goal}
          時間枠: ${timeframe || '特に指定なし'}
          現在のレベル: ${userLevel || '未指定'}
          ${userPreference ? `ユーザー設定: ${userPreference}` : ''}
          
          この目標を達成するための詳細なロードマップを作成してください。実践的で具体的な学習パスを示し、
          以下の情報を含めてください：

          1. ロードマップ全体のタイトル
          2. 詳細な説明
          3. 予想される総学習時間（時間単位）
          4. 学習ノードのリスト（階層構造、各ノードには以下を含む）：
            - タイトル
            - 説明
            - 重要度（'essential'、'recommended'、'optional'のいずれか）
            - 予想される学習時間（時間単位）
            - 子ノード（階層構造を形成）
          5. 主要なマイルストーン（重要な達成ポイント）

          レスポンスは以下のJSON形式で返してください：
          {
            "title": "ロードマップのタイトル",
            "description": "詳細な説明",
            "estimatedTotalHours": 数値,
            "nodes": [
              {
                "title": "ノード1タイトル",
                "description": "ノード1の説明",
                "importance": "essential/recommended/optional",
                "estimatedHours": 数値,
                "children": [
                  // 子ノード（同じ構造）
                ]
              },
              // 他のルートノード
            ],
            "milestones": [
              {
                "title": "マイルストーン1",
                "description": "説明",
                "nodeIds": [] // 関連するノードのID（自動生成されるため空配列を返す）
              }
            ]
          }`
        }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    console.log('ロードマップ応答受信');
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      console.error('APIからの応答が空です');
      return createDefaultRoadmap(goal);
    }

    try {
      const roadmapData = JSON.parse(responseContent.trim());
      
      // IDを付与する（存在しない場合）
      const assignIds = (nodes: RoadmapNode[], parentId?: string) => {
        for (const node of nodes) {
          if (!node.id) {
            node.id = crypto.randomUUID();
          }
          node.parentId = parentId;
          
          if (Array.isArray(node.children) && node.children.length > 0) {
            assignIds(node.children, node.id);
          }
        }
      };
      
      if (Array.isArray(roadmapData.nodes)) {
        assignIds(roadmapData.nodes);
      }
      
      // 現在時刻を設定
      const now = new Date();
      
      // ロードマップオブジェクトを生成
      const roadmap: Roadmap = {
        id: crypto.randomUUID(),
        title: roadmapData.title || `${goal}のロードマップ`,
        description: roadmapData.description || '学習目標達成のためのロードマップ',
        goalDescription: roadmapData.goalDescription || goal,
        category: roadmapData.category || 'learning',
        level: roadmapData.level as LearningLevel,
        estimatedTotalHours: roadmapData.estimatedTotalHours || 100,
        nodes: roadmapData.nodes || [],
        milestones: roadmapData.milestones || [],
        createdAt: now,
        updatedAt: now,
        version: 1
      };
      
      console.log(`ロードマップ生成完了: ${roadmap.nodes.length}ノード`);
      return roadmap;
    } catch (error) {
      console.error('JSON解析エラー:', error);
      return createDefaultRoadmap(goal);
    }
  } catch (error) {
    console.error('ロードマップ生成エラー:', error);
    return createDefaultRoadmap(goal);
  }
}

// デフォルトのロードマップを作成する関数
function createDefaultRoadmap(goal: string): Roadmap {
  const now = new Date();
  const defaultLevel: LearningLevel = 'beginner';
  const defaultCategory = 'learning';
  
  return {
    id: crypto.randomUUID(),
    title: `${goal}のロードマップ`,
    description: '学習目標達成のためのロードマップ',
    goalDescription: goal,
    category: defaultCategory,
    level: defaultLevel,
    estimatedTotalHours: 20,
    nodes: [
      {
        id: crypto.randomUUID(),
        title: "基礎を学ぶ",
        description: `${goal}の基礎を学びます。`,
        level: defaultLevel,
        category: defaultCategory,
        importance: "essential",
        estimatedHours: 5,
        children: []
      },
      {
        id: crypto.randomUUID(),
        title: "応用を学ぶ",
        description: `${goal}の応用を学びます。`,
        level: defaultLevel,
        category: defaultCategory,
        importance: "essential",
        estimatedHours: 10,
        children: []
      },
      {
        id: crypto.randomUUID(),
        title: "実践する",
        description: `${goal}を実践します。`,
        level: defaultLevel,
        category: defaultCategory,
        importance: "essential",
        estimatedHours: 5,
        children: []
      }
    ],
    milestones: [
      {
        title: "基礎の習得",
        description: "基礎を習得しました。",
        nodeIds: []
      }
    ],
    createdAt: now,
    updatedAt: now,
    version: 1
  };
}

// 小タスク生成の関数
export async function generateMicroTasks(node: RoadmapNode, count: number = 5): Promise<MicroTask[]> {
  try {
    if (!isApiAvailable()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    
    console.log('小タスク生成開始:', node.title);
    
    const systemPrompt = `あなたは学習コンテンツと課題作成の専門家です。
    与えられたロードマップのノード（学習トピック）に基づいて、具体的で実践的な小タスクを作成してください。
    
    小タスクとは、ユーザーが実際に手を動かして取り組める具体的な学習活動や課題のことです。
    読むだけ、見るだけではなく、実際にコードを書いたり、問題を解いたり、プロジェクトを作成したりするアクティブラーニングを促進するものであるべきです。
    
    以下の要素を含む小タスクのリストをJSON配列形式で作成してください：
    
    - id: タスクの一意識別子（空文字でOK、システムで自動生成します）
    - title: タスク名（簡潔で明確に）
    - description: タスクの簡単な概要（1-2文）
    - type: タスクの種類（"reading", "exercise", "project", "quiz", "practice"のいずれか）
    - difficulty: 難易度（"easy", "medium", "hard"のいずれか）
    - estimatedMinutes: 完了までの予想時間（分単位）
    - instructions: タスクの詳細な手順（十分に具体的であること）
    - resources: 関連するリソース（URL、書籍名など）
    - codeSnippet: コードスニペット（該当する場合）
    - expectedOutput: 期待される結果（該当する場合）
    - hints: ヒント（つまずいた場合のためのヒント）
    
    以下のガイドラインに従って小タスクを作成してください：
    
    - タスクは具体的で実用的であること
    - タスクは実際に手を動かすことを重視すること
    - 理論だけでなく実践を含めること
    - タスクは与えられたノードのトピックに直接関連していること
    - 難易度はユーザーのレベルに合わせること
    - タスクは明確な目標と達成条件を持つこと
    
    ${count}個の小タスクを含むJSON配列のみを返してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `以下のロードマップノード（学習トピック）に基づいて、具体的な小タスクを${count}個作成してください：
          
          トピック: ${node.title}
          説明: ${node.description}
          レベル: ${node.level}
          カテゴリ: ${node.category}
          重要度: ${node.importance}
          推定学習時間: ${node.estimatedHours}時間
          
          このトピックに関連する具体的で実践的な小タスクを作成してください。
          ユーザーが実際に手を動かして取り組める内容で、学習効果が高いものにしてください。`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    console.log('小タスク応答受信');
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      console.error('APIからの応答が空です');
      return createDefaultMicroTasks(node);
    }

    try {
      // JSON応答をパース
      const tasksData = JSON.parse(responseContent.trim());
      const tasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.error('小タスク生成結果が空または配列ではありません');
        return createDefaultMicroTasks(node);
      }
      
      // 現在時刻
      const now = new Date();
      
      // 小タスクの配列を生成
      const microTasks: MicroTask[] = tasks.map((task: {
        title?: string;
        description?: string;
        type?: string;
        difficulty?: string;
        estimatedMinutes?: number;
        instructions?: string;
        resources?: string[];
        codeSnippet?: string;
        expectedOutput?: string;
        hints?: string[];
      }) => ({
        id: crypto.randomUUID(),
        roadmapNodeId: node.id,
        title: task.title || `${node.title}に関するタスク`,
        description: task.description || '詳細情報はありません',
        type: task.type && ['reading', 'exercise', 'project', 'quiz', 'practice'].includes(task.type) 
          ? task.type as 'reading' | 'exercise' | 'project' | 'quiz' | 'practice' : 'practice',
        difficulty: task.difficulty && ['easy', 'medium', 'hard'].includes(task.difficulty)
          ? task.difficulty as 'easy' | 'medium' | 'hard' : 'medium',
        estimatedMinutes: task.estimatedMinutes && !isNaN(Number(task.estimatedMinutes))
          ? Number(task.estimatedMinutes) : 30,
        instructions: task.instructions || '詳細な手順はありません',
        resources: Array.isArray(task.resources) ? task.resources : [],
        codeSnippet: task.codeSnippet || undefined,
        expectedOutput: task.expectedOutput || undefined,
        hints: Array.isArray(task.hints) ? task.hints : [],
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }));
      
      console.log(`小タスク生成完了: ${microTasks.length}タスク`);
      return microTasks;
    } catch (error) {
      console.error('JSON解析エラー:', error);
      return createDefaultMicroTasks(node);
    }
  } catch (error) {
    console.error('小タスク生成エラー:', error);
    return createDefaultMicroTasks(node);
  }
}

// デフォルトの小タスクを作成する関数
function createDefaultMicroTasks(node: RoadmapNode): MicroTask[] {
  const now = new Date();
  
  return [
    {
      id: crypto.randomUUID(),
      roadmapNodeId: node.id,
      title: `${node.title}の基本概念を学ぶ`,
      description: `${node.title}に関する基本的な概念と用語を学習する`,
      type: 'reading',
      difficulty: 'easy',
      estimatedMinutes: 30,
      instructions: `1. ${node.title}に関する基本的な用語や概念を調べる\n2. 重要なポイントをノートにまとめる\n3. 理解度をチェックするための質問に答える`,
      resources: ['推奨される入門書籍やオンラインリソース'],
      status: 'pending',
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      roadmapNodeId: node.id,
      title: `${node.title}の演習問題に取り組む`,
      description: `${node.title}についての理解を深めるための演習問題`,
      type: 'exercise',
      difficulty: 'medium',
      estimatedMinutes: 45,
      instructions: `1. 提供された演習問題を解く\n2. 解答を確認し、間違いを理解する\n3. 難しかった問題を再度解いてみる`,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      roadmapNodeId: node.id,
      title: `${node.title}の小プロジェクトを作成`,
      description: `${node.title}の知識を活用した小規模なプロジェクト`,
      type: 'project',
      difficulty: 'medium',
      estimatedMinutes: 60,
      instructions: `1. プロジェクトの要件を確認\n2. 必要な環境をセットアップ\n3. ステップバイステップで実装\n4. 動作テストを行う\n5. 改善点を考察する`,
      hints: ['まずは最小限の機能から始める', '問題が発生したら分割して考える'],
      status: 'pending',
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      roadmapNodeId: node.id,
      title: `${node.title}の知識をテストする`,
      description: `${node.title}についての理解度を確認するためのクイズ`,
      type: 'quiz',
      difficulty: 'easy',
      estimatedMinutes: 20,
      instructions: `1. 用意されたクイズに答える\n2. 正答を確認し、間違えた問題を復習する\n3. 理解が不十分な箇所を特定する`,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      roadmapNodeId: node.id,
      title: `${node.title}を実践的に応用する`,
      description: `${node.title}の知識を実際の問題解決に応用する`,
      type: 'practice',
      difficulty: 'hard',
      estimatedMinutes: 90,
      instructions: `1. 実践的な問題シナリオを確認\n2. 解決策を計画\n3. 実装または解決策を実行\n4. 結果を評価し、改善点を考察`,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }
  ];
}

// タスクを生成する関数
export async function generateTask(
  title: string,
  goal: string = "",
  description: string = "",
  dueDate: Date | null = null,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<Task> {
  console.log(`Generating task: ${title}`);
  
  try {
    // 現在の日付から7日後をデフォルトの締め切りとする
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    
    // タスクオブジェクトを作成
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description: goal ? `${description}\n目標: ${goal}` : description,
      dueDate: dueDate || defaultDueDate,
      priority,
      status: 'pending',
      estimatedTime: 60, // デフォルトは60分
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`Task generation completed: ${task.id}`);
    return task;
    
  } catch (error) {
    console.error('Error generating task:', error);
    // エラーが発生した場合はシンプルなタスクを返す
    return {
      id: crypto.randomUUID(),
      title: title || 'タスク',
      description: description || 'タスクの説明',
      dueDate: null,
      priority: 'medium',
      status: 'pending',
      estimatedTime: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
} 