class PlayerModel {
  final String id;
  final String playerName;
  final String? characterName;
  final String? characterClass;
  final String? avatarAsset;
  final bool hasCharacter;
  final bool isCurrentUser;

  const PlayerModel({
    required this.id,
    required this.playerName,
    this.characterName,
    this.characterClass,
    this.avatarAsset,
    required this.hasCharacter,
    this.isCurrentUser = false,
  });

  // Cria uma cópia do jogador com novos valores
  PlayerModel copyWith({
    String? id,
    String? playerName,
    String? characterName,
    String? characterClass,
    String? avatarAsset,
    bool? hasCharacter,
    bool? isCurrentUser,
  }) {
    return PlayerModel(
      id: id ?? this.id,
      playerName: playerName ?? this.playerName,
      characterName: characterName ?? this.characterName,
      characterClass: characterClass ?? this.characterClass,
      avatarAsset: avatarAsset ?? this.avatarAsset,
      hasCharacter: hasCharacter ?? this.hasCharacter,
      isCurrentUser: isCurrentUser ?? this.isCurrentUser,
    );
  }

  // Jogadores mockados para teste
  static List<PlayerModel> getMockPlayers() {
    return [
      const PlayerModel(
        id: '1',
        playerName: 'Você',
        characterName: 'Adelmar',
        characterClass: 'Guerreiro',
        avatarAsset: 'assets/shared/characters/guerreiro.png',
        hasCharacter: true,
        isCurrentUser: true,
      ),
      const PlayerModel(
        id: '2',
        playerName: 'Beltrano',
        hasCharacter: false,
        isCurrentUser: false,
      ),
    ];
  }
}
