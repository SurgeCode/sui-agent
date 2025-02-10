export const supportedCoins = [
    "0x2::sui::SUI",
    "0xa8816d3a6e3136e86bc2873b1f94a15cadc8af2703c075f2d546c2ae367f4df9::ocean::OCEAN",
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    "0xbff8dc60d3f714f678cd4490ff08cabbea95d308c6de47a150c79cc875e0c7c6::sbox::SBOX",
    "0x361dd589b98e8fcda9a7ee53b85efabef3569d00416640d2faa516e3801d7ffc::TOKEN::TOKEN",
    "0xea65bb5a79ff34ca83e2995f9ff6edd0887b08da9b45bf2e31f930d3efb82866::s::S",
    "0x506a6fc25f1c7d52ceb06ea44a3114c9380f8e2029b4356019822f248b49e411::memefi::MEMEFI",
    "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
    "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
    "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS",
    "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB",
    "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD",
    "0xa340e3db1332c21f20f5c08bef0fa459e733575f9a7e2f5faca64f72cd5a54f2::fomo::FOMO",
    "0xb779486cfd6c19e9218cc7dc17c453014d2d9ba12d2ee4dbb0ec4e1e02ae1cca::spt::SPT",
    "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    "0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE",
    "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI"
  ];

  export const mainnet =   {
    "GlobalConfig": "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352",
    "ProtocolFeeCap": "0x55697473304e901372020f30228526c4e93558b23259d90bc6fdddedf83295d2",
    "Display": "0x5f34ee74e113d74ae9546695af6e6d0fde51731fe8d9a71309f8e66b725d54ab",
    "AdminCap": "0xc5e736b21175e1f8121d58b743432a39cbea8ee23177b6caf7c2a0aadba8d8b9",
    "UpgradeCap": "0xd5b2d2159a78030e6f07e028eb75236693ed7f2f32fecbdc1edb32d3a2079c0d",
    "Publisher": "0xd9810c5d1ec5d13eac8a70a059cc0087b34d245554d8704903b2492eebb17767",
    "BasePackage": "0x3492c874c1e3b3e2984e8c41b589e642d4d0a5d6459e5a9cfc2d52fd7c89c267",
    "CurrentPackage": "0x6c796c3ab3421a68158e0df18e4657b2827b1f8fed5ed4b82dba9c935988711b",
    "Operators": {
        "Admin": "0x37a8d55f29e5b4bdba0cb3fe0ba51a93db8c868fe0de649e1bf36bb42ea7d959"
    },
    "Pools": [
        {
            "id": "0x0c89fd0320b406311c05f1ed8c4656b4ab7ed14999a992cc6c878c2fad405140",
            "coinA": "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 6,
            "coinBDecimals": 6,
            "name": "wUSDC-USDC",
            "fee": 100,
            "tickSpacing": 1
        },
        {
            "id": "0xf6ab5a6e7cd88b99c8c434fc7fa739c693e1731342e5b5a42c137fdef291bcac",
            "coinA": "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
            "coinB": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            "coinADecimals": 9,
            "coinBDecimals": 9,
            "name": "haSUI-SUI",
            "fee": 100,
            "tickSpacing": 1
        },
        {
            "id": "0x0321b68a0fca8c990710d26986ba433d06b351deba9384017cd6175f20466a8f",
            "coinA": "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 6,
            "coinBDecimals": 6,
            "name": "USDT-USDC",
            "fee": 100,
            "tickSpacing": 1
        },
        {
            "id": "0x3b585786b13af1d8ea067ab37101b6513a05d2f90cfe60e8b1d9e1b46a63c4fa",
            "coinA": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 9,
            "coinBDecimals": 6,
            "name": "SUI-USDC",
            "fee": 2000,
            "tickSpacing": 40
        },
        {
            "id": "0xa701a909673dbc597e63b4586ace6643c02ac0e118382a78b9a21262a4a2e35d",
            "coinA": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 9,
            "coinBDecimals": 6,
            "name": "SUI-USDC",
            "tickSpacing": 20,
            "fee": 1000
        },
		{
			"id": "0xfe36ddc436cefc95d320ad1ecb088f8156d306f5b00f7b8626148dfe349b9984",
            "coinA": "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 8,
            "coinBDecimals": 6,
            "name": "ETH-USDC",
            "tickSpacing": 40,
            "fee": 2000
        },
        {
            "id": "0x38282481e3a024c50254c31ebfc4710e003fe1b219c0aa31482a860bd58c4ab0",
            "coinA": "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
            "coinB": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            "coinADecimals": 8,
            "coinBDecimals": 6,
            "name": "WBTC-USDC",
            "tickSpacing": 40,
            "fee": 2000
        },
        {
			"id": "0x1b06371d74082856a1be71760cf49f6a377d050eb57afd017f203e89b09c89a2",
			"coinA": "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
			"coinB": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
			"coinADecimals": 6,
			"coinBDecimals": 9,
			"name": "DEEP-SUI",
			"tickSpacing": 40,
			"fee": 2000
		}
    ]
}