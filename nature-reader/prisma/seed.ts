import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { UserRole, PostStatus } from '@prisma/client';

let prisma: any;

async function main() {
  const prismaModule = await import('../src/lib/prisma');
  prisma = prismaModule.prisma;
  console.log('🌱 Bắt đầu gieo hạt dữ liệu (seeding)...');


  // 1. Dọn dẹp dữ liệu cũ (Xóa theo thứ tự quan hệ khóa ngoại)
  console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
  await prisma.moderationLog.deleteMany({});
  await prisma.postReport.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.profile.deleteMany({});

  // 2. Tạo Profiles (UUID cho Profile cần khớp với Auth hoặc giả lập)
  console.log('👤 Đang tạo các tài khoản người dùng (Profiles)...');
  const adminId = '2a7a4073-7e46-4dfc-8be6-57cb521a086a';
  const user1Id = '5c9f5643-4be9-4e78-8742-892410a8d6e3';
  const user2Id = '7fd5d2ab-0091-4977-8fa5-72bc21a4fb42';

  const admin = await prisma.profile.create({
    data: {
      id: adminId,
      email: 'admin@tramdocxanh.vn',
      displayName: 'Đặng Tuấn Anh',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm1NO2J5n_OAKNopwHMrS_C4XsuYWm_weWx9KD2GZ3L1Zv10E5s9bnRuTGANTpO0UmK6X7Nf3YkZ87n_A2A_Szy35kUpKNRwwWOYBwSlK0zCUnKPe5LcQOer9wJfq3CjNu9Xj428EEPV5Pqhpt1LA-tuJsHvhMUpWM9zSAM_SlWPkFWVO-ZliwMJYsry9NWBekHypZfH75mxrmd4NYLqqbi-nrJefMWGJ2dKz84Vq2kHtphBbqCTowIWkDwgdfgzHtyQ9WTbhYGXI',
      bio: 'Kiểm duyệt viên trưởng hệ thống Trạm Đọc Xanh. Người bảo vệ tri thức xanh.',
      role: UserRole.admin,
    },
  });

  const user1 = await prisma.profile.create({
    data: {
      id: user1Id,
      email: 'minhanh@gmail.com',
      displayName: 'Minh Anh',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQRjFjLmzlmnpVWGdnIpGXNMJ_C5wyeDgkGfhoR_Te7YVKWPkEFJ4oLTwUosqpD7Re0dTPZpmFX3Wq_iJuYTxhbgUjwsWINaC1_-b1-_woxMMYQjXuImOx2beqJ4gaCj7epdWg1wvSozofO-VMfTWrkxrDb9-ZTqb_JrUlaTLoomZB1KjWuN9XXbYgeSR1NQyoy77soxOD3jI7_c1IlSrWLwBnmeOHzysGKM3kIVVRbeMmjI92_DDVF1v9_kjOdfKxTVhcQNKUhVA',
      bio: 'Yêu thiên nhiên, thích đọc sách văn học và có lối sống tối giản.',
      role: UserRole.user,
    },
  });

  const user2 = await prisma.profile.create({
    data: {
      id: user2Id,
      email: 'minhphuong@gmail.com',
      displayName: 'Minh Phương',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAk5V3AbfJ8n-KqeAR98GnbVa6ROadqJNGGCtUo1DoH4Pz4TBBU2wCIojCNv_3RpSpYoEEw3IFHv4DhOuH9ewkTOu6CPEXlzunXhEyF5cppNB2AP7M6hxbTuieRWNR_QAEjtkX9OTZU1DfTO6MNTkh1kLZFqeb2Apdqooq8GSAgZnBNcetcuB8Bz7JdFaDahtGLd3eVKBWgkPo72kIhHXZNfz_DNMr0w_RXVdppUpZGF4l1Dn0C4R1V5ihk3FBqv7n181DaO0Rgy9c',
      bio: 'Nhà báo tự do. Đam mê triết học cổ điển và sách bảo vệ sinh thái.',
      role: UserRole.user,
    },
  });

  // 3. Tạo Sách (Books)
  console.log('📚 Đang gieo hạt thư viện sách (Books)...');
  const book1Id = '1b4fa8d9-3172-4632-a542-f8c5b16ea982';
  const book2Id = 'bc9b2c5c-7d93-4ea2-b5cf-7ef8de4d1d91';
  const book3Id = '38c92a5d-ee18-47bc-8a71-6fd71fa9d1be';

  const book1 = await prisma.book.create({
    data: {
      id: book1Id,
      title: 'Cây Cam Ngọt Của Tôi',
      author: 'José Mauro de Vasconcelos',
      summary: 'Một câu chuyện cảm động về tuổi thơ của cậu bé Zezé nghèo khổ đầy nghịch ngợm và trái tim ấm áp.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcAa0VXblj74ZyUhLRe7T-6ckhEgIuaqOC4MGucG8BqL9ipY1VZXQ-94smq_37lqXXyOe3rnks7s6z6-IO6uZ03BKdZou-TNc9cMkfGIxa8x8VMoHFur3H3WHDo3LplR6dlLKRd38temPcoLFvUkuTvOtVTZwcTuuSYSn4z3W5KUos2ROubEfeKLcFY_VQHZhlcWj_LRswe6nrtYLjI0Qqc3BDpH_hpM1akeKySxL6psML-8PBuEkK_JjoxHv0dgmwzgvELjw1fIA',
      publishedYear: 1968,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      id: book2Id,
      title: 'Lối sống tối giản của người Nhật',
      author: 'Sasaki Fumio',
      summary: 'Chia sẻ hành trình cắt giảm đồ đạc để giải phóng tinh thần và tìm kiếm hạnh phúc đích thực của tác giả.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ7FsFaU2l14J3IKs3aWxCDraJmhVklxt67rijcdiVy3iojp6wP-6HtDOOzO9raH6Ttgs3IELgeLYP0WiRafUS9wGZPD2C8J0XRUK3GZamHtWR2-PIkzcXl8tm2nYMBljNHZdG47TxnWJbaP4fM-pvNUpeQd8j2E7sAjcVM_y2MFJxHuE0WFsehc8AkMxXonZYayMgamiM0pSFMxZY1lj8qRqFRQivFlUbPQUh4C28GvI6sYgPYjTcWjg6FtyxeAi1awDvRQlO1Eo',
      publishedYear: 2015,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      id: book3Id,
      title: 'Thư viện bền vững',
      author: 'Green Reader Group',
      summary: 'Hướng dẫn thiết thực về việc xây dựng không gian thư viện bền vững và bảo vệ hệ sinh thái thông qua sách giấy tái chế.',
      coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN6yDVmrKPSAkfT_gGtGm2PzQEk3v7ikT4y9UsXcL77ZkrlxDBelWQC7F5pZ4dZN2KqeVMQlt0vjPepCjjCjANHJcZIrT16--x-yrftUMfqUb5L8sIqz5wca1YtUFWAGiaEncz_g_6kcEyWkRxwIlXo95opdcZ2DMDWUr6s1A-g5HejHZlfAF8JjDf_V6mn-K1dL5RZWAeXKJSkF1of2aTLD44um92p9FyyLloYhwq2DFlCOU7dm_WeBWCfmJOB8cW-R0ff6DPdMM',
      publishedYear: 2023,
    },
  });

  // 4. Tạo các bài viết Review (Posts)
  console.log('📝 Đang gieo hạt các bài cảm nhận sách (Posts)...');
  const post1Id = 'f7d6a5c4-e3b2-4d1c-8f0a-9d8c7b6a5e4d';
  const post2Id = '3d2c1b0a-9f8e-4d7c-a6b5-0c9d8e7f6a5b';
  const post3Id = '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d';

  const post1 = await prisma.post.create({
    data: {
      id: post1Id,
      userId: user1Id,
      bookId: book1Id,
      title: 'Cây Cam Ngọt Của Tôi - Nỗi đau ngọt ngào của tuổi thơ dữ dội',
      contentMarkdown: `Zezé là một cậu bé năm tuổi, cực kỳ thông minh và cũng cực kỳ nghịch ngợm. Zezé sống trong một gia đình nghèo đông con, nơi mà những cái tát và những trận đòn roi thay cho lời yêu thương. Thế giới của Zezé chỉ thực sự rạng rỡ khi cậu tìm thấy "người bạn" đặc biệt của mình - một cây cam ngọt sau vườn mà cậu gọi là Pinkie.

Cuốn sách không chỉ là một câu chuyện về tuổi thơ mà còn là một bài ca về lòng nhân ái. Tác giả José Mauro de Vasconcelos đã lột tả một cách chân thực nhất những khao khát được yêu thương của một đứa trẻ. Sự xuất hiện của ông Bồ (Portugá) chính là bước ngoặt thay đổi cuộc đời Zezé, cho cậu thấy thế giới này vẫn còn những điều tốt đẹp và tình yêu thực sự tồn tại.

Đoạn kết của cuốn sách có thể khiến bất kỳ ai cũng phải rơi nước mắt. Nó không phải là một cái kết có hậu theo kiểu cổ tích, mà là một sự kết thúc của tuổi thơ để bắt đầu một cuộc đời mới - cuộc đời của một người trưởng thành đầy những vết xước nhưng cũng đầy sự thấu hiểu. 'Cây Cam Ngọt Của Tôi' là lời nhắc nhở rằng chúng ta cần phải yêu thương trẻ em nhiều hơn, bằng cả trái tim mình.`,
      status: PostStatus.approved,
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      id: post2Id,
      userId: user2Id,
      bookId: book2Id,
      title: 'Nghệ thuật đọc sách chậm trong kỷ nguyên số',
      contentMarkdown: `Trong một thế giới đầy rẫy những thông tin ngắn hạn và sự xao nhãng liên tục, việc dành thời gian để thực sự chìm đắm vào một cuốn sách không chỉ là một sở thích, mà là một hành động kháng cự bền bỉ.

Lối sống tối giản của Sasaki Fumio không chỉ áp dụng cho đồ đạc vật chất, mà còn mở rộng sang cả cách chúng ta tiêu thụ tri thức. Khi bạn tối giản hóa nhu cầu tiếp nhận thông tin giật gân hàng ngày, tâm trí bạn sẽ tự động mở ra một khoảng trống thanh tịnh dành cho những suy ngẫm sâu sắc từ trang sách.

Hãy tắt thông báo điện thoại, pha một tách trà nóng và bắt đầu mở những trang sách chậm rãi. Sức khỏe tinh thần của bạn sẽ được chữa lành hiệu quả qua từng con chữ.`,
      status: PostStatus.approved,
      approvedBy: adminId,
      approvedAt: new Date(),
    },
  });

  // Bài viết ở trạng thái Pending (Chờ kiểm duyệt để test Admin)
  const post3 = await prisma.post.create({
    data: {
      id: post3Id,
      userId: user2Id,
      bookId: book3Id,
      title: 'Thư viện xanh bền vững cho tương lai tươi sáng',
      contentMarkdown: `Làm thế nào để chúng ta có thể vừa thỏa mãn đam mê đọc sách vừa bảo vệ môi trường? Thư viện bền vững không chỉ là về số lượng sách, mà là về cách chúng ta luân chuyển và gìn giữ tinh hoa nhân loại một cách thông minh nhất.

Xây dựng thư viện xanh bắt nguồn từ việc chắt lọc những cuốn sách thực sự đồng điệu với bản thân. Một cuốn sách nằm im lặng bám bụi trên kệ suốt nhiều năm chính là một dòng tri thức bị đóng băng. 

"Người biết đủ là người giàu có nhất."

Hãy bắt đầu việc trao đổi sách định kỳ trong cộng đồng, quyên tặng những văn bản quý giá cho các thư viện công cộng và tìm đọc sách trên các chất liệu thân thiện với sinh thái. Đó mới chính là cách chúng ta nâng đỡ và lan tỏa văn hóa đọc bền bỉ mãi về sau.`,
      status: PostStatus.pending,
    },
  });

  // 5. Tạo các bình luận (Comments)
  console.log('💬 Đang gieo hạt các bình luận thảo luận (Comments)...');
  await prisma.comment.create({
    data: {
      postId: post1Id,
      userId: adminId,
      content: 'Bài viết viết rất sâu sắc và chạm đến trái tim người đọc. Cuốn sách này quả thực là một kiệt tác nuôi dưỡng lòng nhân ái!',
    },
  });

  await prisma.comment.create({
    data: {
      postId: post1Id,
      userId: user2Id,
      content: 'Tôi cũng đã khóc ở đoạn kết. Cảm ơn bạn vì bài cảm nhận rất hay và truyền cảm hứng này.',
    },
  });

  // 6. Tạo các lượt thích (Likes)
  console.log('❤️ Đang gieo hạt lượt thích bài viết (Likes)...');
  await prisma.postLike.create({
    data: {
      userId: adminId,
      postId: post1Id,
    },
  });

  await prisma.postLike.create({
    data: {
      userId: user2Id,
      postId: post1Id,
    },
  });

  await prisma.postLike.create({
    data: {
      userId: user1Id,
      postId: post2Id,
    },
  });

  console.log('🎉 Seed database hoàn thành thành công và mỹ mãn!');
}

main()
  .catch((e) => {
    console.error('❌ Có lỗi xảy ra trong quá trình seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
