import { KanbanRepository, MessengerPresenter } from '@sf/adapters';
import { Part } from '@sf/entities';

import { CardAbnormalReason, isCardAbnormal } from '../entities/kanban';
import { KanbanService } from '../services/kanbanService';

export const createKanbanService = ({
  kanbanRepository,
  messengerPresenter,
}: {
  kanbanRepository: KanbanRepository;
  messengerPresenter: MessengerPresenter;
}): KanbanService => {
  return {
    sendDashboard: async () => {
      const cards = (await kanbanRepository.listCards()).filter((c) => c.status === 'In Progress');

      await messengerPresenter.sendThread(
        ({ formatLink, formatEmoji, formatBold }) =>
          [
            `${formatBold('SNUTT 무슨 일이 일어나고 있나요?')} ${formatEmoji('wip')}`,
            '',
            ...cards.map(
              (c) =>
                `${formatEmoji(
                  c.part
                    ? (
                        {
                          [Part.ALL]: 'snutt',
                          [Part.ANDROID]: 'android',
                          [Part.DESIGN]: 'design',
                          [Part.FRONTEND]: 'react',
                          [Part.IOS]: 'ios',
                          [Part.SERVER]: 'spring',
                        } as const
                      )[c.part]
                    : ('null' as const),
                )} ${formatLink(c.title, { url: c.url })}`,
            ),
          ].join('\n'),
        [],
      );
    },

    sendAbnormalCardStatuses: async () => {
      const cards = (await kanbanRepository.listCards()).filter(
        (c) => c.status === 'In Progress' || c.status === 'In Review' || c.status === 'Backlog' || c.status === 'To Do',
      );

      const abnormalCards = cards.flatMap((card) => {
        const result = isCardAbnormal(card);
        if (!result.abnormal) return [];
        return [{ ...card, reason: result.reason }];
      });

      await messengerPresenter.sendThread(
        () => '칸반 이슈',
        abnormalCards.map((card) => ({ formatMemberMention, formatPartMention, formatLink }) => {
          const mention =
            card.assignee.length === 0
              ? formatPartMention(card.part ?? Part.ALL)
              : card.assignee.map(formatMemberMention).join(' ');
          const title = formatLink(card.title, { url: card.url });
          const reason = REASON_MESSAGE_MAP[card.reason];
          return `${mention} ${title}\n\n${reason}`;
        }),
      );
    },
  };
};

const REASON_MESSAGE_MAP: Record<CardAbnormalReason, string> = {
  [CardAbnormalReason.DUE_DATE_PASSED]: '설정된 schedule이 지났습니다. 일정을 변경하거나 상태를 업데이트해 주세요.',
  [CardAbnormalReason.NO_ASSIGNEE]: '담당자가 없습니다. 담당자를 지정해 주세요.',
  [CardAbnormalReason.NO_SCHEDULE]: 'schedule이 없습니다. 일정을 설정하거나 상태를 Backlog로 변경해 주세요.',
  [CardAbnormalReason.NO_PART]: 'Group이 없습니다. Group을 지정해 주세요.',
};
