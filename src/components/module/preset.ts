export interface Template {
  id: string
  name: string
  category: string
  data: any 
}
export const presetTemplates: Template[] = [
  {
    id: '1',
    name: 'Больничный',
    category: 'Stuff',
    data: {
      objects: [
        {
          type: 'textbox',
          text: 'Данная спраыка подтвреждает, что пациент скорее мертв чем жив. Работа противопоказана.',
          left: 200, top: 200,
          fontSize: 32, fontFamily: 'Arial', fill: '#e74c3c'
        }
      ],
      background: '#fff9c4'
    }
  },
  {
    id: '2',
    name: 'Служебка',
    category: 'Stuff',
    data: {
      objects: [
        {
          type: 'textbox',
          text: 'Студент Гадя Петровича Хренова, была на мероприятии по сбору урожая хлопка. Просьба понять и простить, пропуск от 6.03.2026 считать по увожительной причине',
          left: 250, top: 250,
          fontSize: 48, fontFamily: 'Impact', fill: '#f39c12'
        }
      ],
      background: '#2c3e50'
    }
  }
]